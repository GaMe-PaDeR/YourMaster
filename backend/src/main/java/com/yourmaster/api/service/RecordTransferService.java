package com.yourmaster.api.service;

import com.yourmaster.api.dto.request.TransferRequest;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.Transfer;

import java.util.List;
import java.util.UUID;

public interface RecordTransferService {
    Transfer createTransferRequest(UUID recordId, UUID userId, Record newRecord);

    List<Transfer> getTransferRequestsBySender(UUID clientId);

    List<Transfer> getTransferRequestsByRecipient(UUID clientId);

    void acceptTransferRequest(UUID transferRequestId);

    void declineTransferRequest(UUID transferRequestId);
}
