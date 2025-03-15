package com.yourmaster.api.controller;

import com.yourmaster.api.dto.response.TimeSlotResponse;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.RescheduleRequest;
import com.yourmaster.api.service.RecordService;
import com.yourmaster.api.service.RescheduleService;
import com.yourmaster.api.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reschedule-requests")
public class RescheduleController {

    @Autowired
    private RescheduleService rescheduleService;

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private RecordService recordService;

    @PostMapping("/{recordId}")
    public ResponseEntity<RescheduleRequest> createRequest(
            @PathVariable UUID recordId,
            @RequestParam LocalDateTime newDateTime) {
        RescheduleRequest request = rescheduleService.createRequest(recordId, newDateTime);
        return ResponseEntity.ok(request);
    }

    @GetMapping
    public ResponseEntity<List<RescheduleRequest>> getRequests() {
        List<RescheduleRequest> requests = rescheduleService.getRequestsForCurrentUser();
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/response")
    public ResponseEntity<Void> processRequest(
            @PathVariable UUID requestId,
            @RequestParam boolean accepted) {
        rescheduleService.processRequest(requestId, accepted);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{recordId}/available-slots")
    public ResponseEntity<List<TimeSlotResponse>> getAvailableSlots(
            @PathVariable UUID recordId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Record record = recordService.getRecordById(recordId);
        List<TimeSlotResponse> slots = serviceService.getAvailableTimeSlots(record.getService().getId(), date);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/{recordId}/available-dates")
    public ResponseEntity<List<String>> getAvailableDates(
            @PathVariable UUID recordId) {
        List<String> dates = rescheduleService.getAvailableDates(recordId);
        return ResponseEntity.ok(dates);
    }
} 