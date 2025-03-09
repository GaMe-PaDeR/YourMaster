package com.yourmaster.api.service;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

import com.yourmaster.api.dto.RecordDto;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.repository.RecordRepository;

public interface RecordService {
    Record createRecord(RecordDto recordDto);

    Record updateRecord(UUID recordId, Record newRecordData);

    void deleteRecord(UUID recordId);

    Record getRecordById(UUID recordId);

    List<Record> getRecordsByClient();

    List<Record> getRecordsByMaster();

    List<Record> getRecordsByUser();

    Record updateRecordStatus(UUID recordId, String newStatus);

    List<Record> getRecordsByDate(LocalDate date);
}
