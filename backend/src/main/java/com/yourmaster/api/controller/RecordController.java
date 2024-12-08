package com.yourmaster.api.controller;

import com.yourmaster.api.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.yourmaster.api.model.Record;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/records")
public class RecordController {
    @Autowired
    private RecordService recordService;

    @PostMapping("/create")
    public ResponseEntity<Record> createRecord(@RequestBody Record record) {
        return ResponseEntity.ok(recordService.createRecord(record));
    }


    @PostMapping("/delete/{recordId}")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID recordId) {
        recordService.deleteRecord(recordId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/update")
    public ResponseEntity<Record> updateRecord(@RequestBody Record record) {
        return ResponseEntity.ok(recordService.updateRecord(record.getId(), record));
    }
}
