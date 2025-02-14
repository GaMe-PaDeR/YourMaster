package com.yourmaster.api.service.impl;

import com.yourmaster.api.dto.request.TransferRequest;
import com.yourmaster.api.enums.TransferRequestStatus;
import com.yourmaster.api.model.Transfer;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.RecordRepository;
import com.yourmaster.api.repository.TransferRequestRepository;
import com.yourmaster.api.repository.UserRepository;
import com.yourmaster.api.service.RecordService;
import com.yourmaster.api.service.RecordTransferService;
import com.yourmaster.api.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.resource.transaction.spi.TransactionCoordinatorBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import com.yourmaster.api.model.Record;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class RecordTransferServiceImpl implements RecordTransferService {
    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RecordService recordService;

    @Autowired
    TransferRequestRepository transferRequestRepository;

    @Override
    public Transfer createTransferRequest(UUID recordId, UUID userId, Record newRecord) {
        Record oldRecord = recordService.getRecordById(recordId);
        User sender = userService.getUserById(userId);
        User recipient;
        if (sender.getRole().toString().equals("ROLE_CLIENT")) {
            recipient = oldRecord.getClient();
        } else {
            recipient = oldRecord.getMaster();
        }

        Transfer request = Transfer.builder()
                .sender(sender)
                .recipient(recipient)
                .createdDateTime(LocalDateTime.now())
                .oldRecord(oldRecord)
                .newRecord(newRecord)
                .status(TransferRequestStatus.CREATED)
                .build();

        transferRequestRepository.save(request);

        return request;
    }

    @Override
    public List<Transfer> getTransferRequestsBySender(UUID userId) {
        User user = userService.getUserById(userId);
        return transferRequestRepository.findAllBySender(user);
    }

    @Override
    public List<Transfer> getTransferRequestsByRecipient(UUID userId) {
        User user = userService.getUserById(userId);
        return transferRequestRepository.findAllByRecipient(user);
    }

    @Override
    public void acceptTransferRequest(UUID transferRequestId) {
        Transfer request = transferRequestRepository.findById(transferRequestId).orElseThrow();
        request.setStatus(TransferRequestStatus.ACCEPTED);
        transferRequestRepository.save(request);

        Record oldRecord = request.getOldRecord();
        Record newRecord = request.getNewRecord();
        oldRecord.setClient(newRecord.getClient());
        recordService.updateRecord(oldRecord.getId(), oldRecord);
//        transferRequestRepository.delete(request);
    }

    @Override
    public void declineTransferRequest(UUID transferRequestId) {
        Transfer request = transferRequestRepository.findById(transferRequestId).orElseThrow();
        request.setStatus(TransferRequestStatus.REJECTED);
        transferRequestRepository.save(request);
    }
}
