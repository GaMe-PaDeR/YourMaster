package com.yourmaster.api.service.impl;

import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.repository.RecordRepository;
import com.yourmaster.api.service.RecordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class RecordServiceImpl implements RecordService {
    @Autowired
    private RecordRepository recordRepository;

    @Override
    public Record createRecord(Record record) {
        log.info("createRecord[1]: Проверка роли мастера");
        if (!Objects.equals(record.getMaster().getRole().toString(), "ROLE_MASTER")) {
            log.error("createRecord[2]: Мастер должен иметь роль ROLE_MASTER");
            throw new RuntimeException("Мастер должен иметь роль ROLE_MASTER");
        }
        log.info("createRecord[3]: Сохранение записи");
        return recordRepository.save(record);
    }

    @Override
    public Record updateRecord(UUID recordId, Record newRecordData) {
        log.info("updateRecord[1]: Поиск существующей записи");
        Record existingRecord = recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
        log.info("updateRecord[2]: Обновление даты записи");
        existingRecord.setRecordDate(newRecordData.getRecordDate());
        log.info("updateRecord[3]: Сохранение обновленной записи");
        return recordRepository.save(existingRecord);
    }

    @Override
    public void deleteRecord(UUID recordId) {
        log.info("deleteRecord[1]: Поиск записи для удаления");
        recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
        log.info("deleteRecord[2]: Удаление записи");
        recordRepository.deleteById(recordId);
    }

    @Override
    public Record getRecord(UUID recordId) {
        log.info("getRecord[1]: Поиск записи");
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
    }

//    public Record createRecord(Record record) {
//        if (!record.getMaster().hasRole("ROLE_MASTER")) {
//            throw new RuntimeException("Мастер должен иметь роль ROLE_MASTER");
//        }
//        return recordRepository.save(record);
//    }
//
//    public Record updateRecord(UUID recordId, Record newRecordData) {
//        Record existingRecord = recordRepository.findById(recordId)
//                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
//
//        existingRecord.setRecordDate(newRecordData.getRecordDate());
//
//        return recordRepository.save(existingRecord);
//    }
//
//    public void deleteRecord(UUID recordId) {
//        recordRepository.findById(recordId)
//                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
//
//        recordRepository.deleteById(recordId);
//    }
//
//    public Record getRecord(UUID recordId) {
//        return recordRepository.findById(recordId)
//                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + recordId));
//    }
}
