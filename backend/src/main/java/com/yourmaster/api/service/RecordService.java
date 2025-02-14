package com.yourmaster.api.service;

import java.util.List;
import java.util.UUID;

import com.yourmaster.api.dto.RecordDto;
import com.yourmaster.api.model.Record;

public interface RecordService {
    Record createRecord(RecordDto recordDto);

    Record updateRecord(UUID recordId, Record newRecordData);

    void deleteRecord(UUID recordId);

    Record getRecordById(UUID recordId);

    List<Record> getRecordsByClient();

    List<Record> getRecordsByMaster();

    List<Record> getRecordsByUser();
}
