package com.yourmaster.api.service.impl;

import com.yourmaster.api.dto.RecordDto;
import com.yourmaster.api.enums.RecordStatus;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Availability;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.RecordRepository;
import com.yourmaster.api.service.RecordService;
import com.yourmaster.api.service.ServiceService;
import com.yourmaster.api.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class RecordServiceImpl implements RecordService {
    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ServiceService serviceService;

    @Override
    public Record createRecord(RecordDto recordDto) {
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
        List<LocalDateTime> availableTime = service.getAvailableDates();

        if (!availableTime.contains(scheduledDate)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Выбранное время недоступно");
        }
        record.setRecordDate(scheduledDate);
        record.setService(service);
        record.setRecordStatus(RecordStatus.SCHEDULED);

        log.info("createRecord[5]: Saving record");
        return recordRepository.save(record);
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
        User currentUser = userService.getCurrentUser();
        log.info("getRecordsByUser[1]: Searching for records by user");
        return recordRepository.findAllByClient_OrMaster_Id(currentUser, currentUser);
    }
}
