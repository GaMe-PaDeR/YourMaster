package com.yourmaster.api.service.impl;

import com.yourmaster.api.enums.RescheduleStatus;
import com.yourmaster.api.model.*;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.repository.RescheduleRequestRepository;
import com.yourmaster.api.repository.RecordRepository;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.service.RescheduleService;
import com.yourmaster.api.service.NotificationService;
import com.yourmaster.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import com.yourmaster.api.model.Record;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RescheduleServiceImpl implements RescheduleService {

    @Autowired
    private RescheduleRequestRepository rescheduleRequestRepository;

    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public RescheduleRequest createRequest(UUID recordId, LocalDateTime newDateTime) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        User currentUser = userService.getCurrentUser();

        // Проверка прав
        if (!record.getClient().equals(currentUser) && !record.getMaster().equals(currentUser)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Нет прав на перенос записи");
        }

        // Проверка доступности времени
        if (!isTimeSlotAvailable(record.getService(), newDateTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Временной слот недоступен");
        }

        RescheduleRequest request = new RescheduleRequest();
        request.setRecord(record);
        request.setNewDateTime(newDateTime);
        request.setRequester(currentUser);

        RescheduleRequest savedRequest = rescheduleRequestRepository.save(request);

        // Отправка уведомления
        User recipient = currentUser.equals(record.getClient()) ? 
            record.getMaster() : record.getClient();
        notificationService.sendRescheduleRequestNotification(recipient, savedRequest);

        return savedRequest;
    }

    @Override
    public void processRequest(UUID requestId, boolean accepted) {
        RescheduleRequest request = rescheduleRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Запрос не найден"));

        if (request.getStatus() != RescheduleStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Запрос уже обработан");
        }

        if (accepted) {
            Record record = request.getRecord();
            record.setRecordDate(request.getNewDateTime());
            recordRepository.save(record);
            request.setStatus(RescheduleStatus.ACCEPTED);
        } else {
            request.setStatus(RescheduleStatus.REJECTED);
        }

        rescheduleRequestRepository.save(request);

        // Уведомление инициатора
        notificationService.sendRescheduleResponseNotification(request.getRequester(), request);
    }

    @Override
    public List<RescheduleRequest> getRequestsForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        return rescheduleRequestRepository.findByRecord_ClientOrRecord_Master(currentUser, currentUser);
    }

    @Override
    public List<String> getAvailableSlots(UUID recordId, String date) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        LocalDate targetDate = LocalDate.parse(date);
        return record.getService().getAvailability().stream()
                .filter(av -> av.getDate().equals(targetDate))
                .flatMap(av -> av.getTimeSlotsMap().entrySet().stream())
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAvailableDates(UUID recordId) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Запись не найдена"));

        return record.getService().getAvailability().stream()
                .map(av -> av.getDate().toString())
                .collect(Collectors.toList());
    }

    private boolean isTimeSlotAvailable(com.yourmaster.api.model.Service service, LocalDateTime dateTime) {
        return service.getAvailability().stream()
                .filter(av -> av.getDate().equals(dateTime.toLocalDate()))
                .flatMap(av -> av.getTimeSlotsMap().entrySet().stream())
                .anyMatch(entry -> entry.getKey().equals(dateTime.toLocalTime().toString().substring(0, 5)) && entry.getValue());
    }
} 