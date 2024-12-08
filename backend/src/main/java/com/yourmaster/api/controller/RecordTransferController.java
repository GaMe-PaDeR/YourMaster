package com.yourmaster.api.controller;

import com.yourmaster.api.dto.request.TransferRequest;
import com.yourmaster.api.enums.RequestType;
import com.yourmaster.api.exception.InvalidRequestTypeException;
import com.yourmaster.api.model.Transfer;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.RecordTransferService;
import com.yourmaster.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.yourmaster.api.model.Record;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/record-transfer")
public class RecordTransferController {

    @Autowired
    private RecordTransferService recordTransferService;

    @Autowired
    private UserService userService;

    @PostMapping("/create-request")
    public ResponseEntity<Transfer> createTransferRequest(@RequestBody Record record) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(recordTransferService.createTransferRequest(record.getId(), user.getId(), record));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<Transfer>> getTransferRequests(
            @RequestParam UUID clientId,
            @RequestParam RequestType requestType) {
        return switch (requestType) {
            case SENT -> ResponseEntity.ok(recordTransferService.getTransferRequestsBySender(clientId));
            case RECEIVED -> ResponseEntity.ok(recordTransferService.getTransferRequestsByRecipient(clientId));
            default -> throw new InvalidRequestTypeException("Недопустимый тип запроса");
        };
    }

    @PostMapping("/accept-request")
    public void acceptTransferRequest(@RequestParam UUID transferRequestId) {
        recordTransferService.acceptTransferRequest(transferRequestId);
//        return ResponseEntity.ok("Success");
    }

    @PostMapping("/decline-request")
    public void declineTransferRequest(@RequestParam UUID transferRequestId) {
        recordTransferService.declineTransferRequest(transferRequestId);
    }
}
