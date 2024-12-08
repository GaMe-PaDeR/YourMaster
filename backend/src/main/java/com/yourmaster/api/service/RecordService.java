package com.yourmaster.api.service;

import java.util.UUID;
import com.yourmaster.api.model.Record;

public interface RecordService {
    Record createRecord(Record record);

    Record updateRecord(UUID recordId, Record newRecordData);

    void deleteRecord(UUID recordId);

    Record getRecord(UUID recordId);
}
