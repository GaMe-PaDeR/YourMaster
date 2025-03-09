package com.yourmaster.api.controller;

import com.yourmaster.api.dto.RecordDto;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.service.UserService;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/records")
public class RecordController {
    @Autowired
    private RecordService recordService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationController notificationController;

    @GetMapping("/client")
    public ResponseEntity<List<Record>> getAllClientRecords() {
        return ResponseEntity.ok(recordService.getRecordsByClient());
    }

    @GetMapping("/master")
    public ResponseEntity<List<Record>> getAllMasterRecords() {
        return ResponseEntity.ok(recordService.getRecordsByMaster());
    }

    @PostMapping("/create")
    public ResponseEntity<Record> createRecord(@RequestBody RecordDto recordDto) throws ApiException {
        Record record = recordService.createRecord(recordDto);
        return ResponseEntity.ok(record);
    }

    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID recordId) {
        recordService.deleteRecord(recordId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/update")
    public ResponseEntity<Record> updateRecord(@RequestBody Record record) {
        return ResponseEntity.ok(recordService.updateRecord(record.getId(), record));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecordsForUser() {
        List<Record> records = recordService.getRecordsByUser();
        String userRole = userService.getCurrentUser().getRole().toString();
        
        Map<String, Object> response = new HashMap<>();
        response.put("records", records);
        response.put("userRole", userRole);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{recordId}/status")
    public ResponseEntity<Record> updateRecordStatus(
        @PathVariable UUID recordId,
        @RequestBody Map<String, String> statusRequest) {
        
        String newStatus = statusRequest.get("status");
        Record updatedRecord = recordService.updateRecordStatus(recordId, newStatus);
        return ResponseEntity.ok(updatedRecord);
    }
}
