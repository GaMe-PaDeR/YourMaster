package com.yourmaster.api.service.impl;

//import com.yourmaster.api.controller.NotificationController;
import com.yourmaster.api.config.SchedulerConfig;
import com.yourmaster.api.controller.NotificationController;
import com.yourmaster.api.dto.RecordDto;
import com.yourmaster.api.enums.RecordStatus;
import com.yourmaster.api.enums.Role;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Availability;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.RecordRepository;
import com.yourmaster.api.service.RecordService;
import com.yourmaster.api.service.ServiceService;
import com.yourmaster.api.service.UserService;
import com.yourmaster.api.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class RecordServiceImpl implements RecordService {
    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public Record createRecord(RecordDto recordDto) {
        try {
            LocalDateTime scheduledDate = recordDto.getRecordDate();

            if (scheduledDate.isBefore(LocalDateTime.now())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Нельзя создавать запись на прошедшее время");
            }

            log.info("createRecord[1]: Getting current user");
            User currentUser = userService.getCurrentUser();
            log.info("createRecord[2]: Checking current user's role");
            Record record = new Record();
            if (Objects.equals(currentUser.getRole().toString(), "ROLE_CLIENT")) {
                log.info("createRecord[3]: Setting client");
                record.setClient(currentUser);
                record.setMaster(userService.getUserById(recordDto.getRecipientId()));
            } else {
                log.info("createRecord[4]: Setting master");
                record.setMaster(currentUser);
                record.setClient(userService.getUserById(recordDto.getRecipientId()));
            }
            com.yourmaster.api.model.Service service = serviceService.getServiceById(recordDto.getServiceId());
            // List<LocalDateTime> availableTime = service.getAvailableDates();

            // if (!availableTime.contains(scheduledDate)) {
            //     throw new ApiException(HttpStatus.FORBIDDEN, "Выбранное время недоступно");
            // }

            Availability selectedAvailability = service.getAvailability().stream()
                .filter(av -> av.getDate().isEqual(scheduledDate.toLocalDate()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Выбранная дата недоступна"));

            String timeKey = scheduledDate.toLocalTime().toString().substring(0, 5);
            if (!selectedAvailability.getTimeSlotsMap().getOrDefault(timeKey, false)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Выбранный временной слот недоступен");
            }

            record.setRecordDate(scheduledDate);
            record.setService(service);
            record.setRecordStatus(RecordStatus.SCHEDULED);

            log.info("createRecord[5]: Saving record");

            // Сохраняем запись
            Record savedRecord = recordRepository.save(record);

            // Отправляем уведомление мастеру о новой записи
            notificationService.sendNewRecordNotification(savedRecord.getMaster().getId(), savedRecord);

            return savedRecord;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating record", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Ошибка при создании записи");
        }
    }

    @Override
    public Record updateRecord(UUID recordId, Record newRecordData) {
        log.info("updateRecord[1]: Searching for an existing record");
        Record existingRecord = recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
        log.info("updateRecord[2]: Updating record date");
        existingRecord.setRecordDate(newRecordData.getRecordDate());
        log.info("updateRecord[3]: Saving updated record");
        return recordRepository.save(existingRecord);
    }

    @Override
    public void deleteRecord(UUID recordId) {
        log.info("deleteRecord[1]: Searching for record to delete");
        getRecordById(recordId);
        log.info("deleteRecord[2]: Deleting record");
        recordRepository.deleteById(recordId);
    }

    @Override
    public Record getRecordById(UUID recordId) {
        log.info("getRecord[1]: Searching for record");
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
    }


    @Override
    public List<Record> getRecordsByClient() {
        UUID currentUserID = userService.getCurrentUser().getId();
        log.info("getRecordsByUser[1]: Searching for records by client");
        return recordRepository.findAllByClientId(currentUserID);
    }

    @Override
    public List<Record> getRecordsByMaster() {
        UUID currentUserID = userService.getCurrentUser().getId();
        log.info("getRecordsByUser[1]: Searching for records by master");
        return recordRepository.findAllByMasterId(currentUserID);
    }

    @Override
    public List<Record> getRecordsByUser() {
        UUID currentUserId = userService.getCurrentUser().getId();
        log.info("getRecordsByUser[1]: Searching for records by user");
        return recordRepository.findAllByClientId_OrMaster_Id(currentUserId, currentUserId);
    }

    @Override
    public Record updateRecordStatus(UUID recordId, String newStatus) {
        log.info("updateRecordStatus[1]: Searching for record with id: {}", recordId);
        Record record = recordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Record", "id", recordId));
        
        // Проверка на отмену записи
        if (newStatus.equals("CANCELLED")) {
            User currentUser = userService.getCurrentUser();
            LocalDateTime now = LocalDateTime.now();
            
            // Если отменяет клиент
            if (currentUser.getRole() == Role.ROLE_CLIENT) {
                // Проверка, что до записи осталось больше 24 часов
                if (record.getRecordDate().isBefore(now.plusHours(24))) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "Клиент может отменить запись только за 24 часа до начала");
                }
                // Отправка уведомления мастеру
                notificationService.sendRecordCancellationNotification(
                    record.getMaster().getId(),
                    "Клиент отменил запись",
                    String.format("Клиент %s отменил запись на %s", 
                        record.getClient().getFirstName(), record.getClient().getLastName(),
                        record.getRecordDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
                    )
                );
            } 
            // Если отменяет мастер
            else if (currentUser.getRole() == Role.ROLE_MASTER) {
                // Отправка уведомления клиенту
                notificationService.sendRecordCancellationNotification(
                    record.getClient().getId(),
                    "Мастер отменил запись",
                    String.format("Мастер %s отменил вашу запись на %s", 
                        record.getMaster().getFirstName(), record.getMaster().getLastName(),
                        record.getRecordDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
                    )
                );
            }
        }

        log.info("updateRecordStatus[2]: Updating status from {} to {}", record.getRecordStatus(), newStatus);
        record.setRecordStatus(RecordStatus.valueOf(newStatus));
        
        log.info("updateRecordStatus[3]: Saving updated record");
        return recordRepository.save(record);
    }

    @Override
    public List<Record> getRecordsByDate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return recordRepository.findByRecordDateBetween(startOfDay, endOfDay);
    }

    @Override
    public List<Record> getRecordsBetweenDates(LocalDateTime start, LocalDateTime end) {
        return recordRepository.findByRecordDateBetween(start, end);
    }

    // @Override
    // public Record rescheduleRecord(UUID recordId, LocalDateTime newDateTime) {
    //     Record record = getRecordById(recordId);
        
    //     if (newDateTime.isBefore(LocalDateTime.now())) {
    //         throw new ApiException(HttpStatus.BAD_REQUEST, "Невозможно перенести на прошедшее время");
    //     }
        
    //     // Проверка доступности нового времени
    //     com.yourmaster.api.model.Service service = record.getService();
    //     Availability availability = service.getAvailability().stream()
    //         .filter(av -> av.getDate().isEqual(newDateTime.toLocalDate()))
    //         .findFirst()
    //         .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Дата недоступна"));
        
    //     String timeKey = newDateTime.toLocalTime().toString().substring(0, 5);
    //     if (!availability.getTimeSlotsMap().getOrDefault(timeKey, false)) {
    //         throw new ApiException(HttpStatus.BAD_REQUEST, "Временной слот недоступен");
    //     }
        
    //     record.setRecordDate(newDateTime);
    //     return recordRepository.save(record);
    // }
}
