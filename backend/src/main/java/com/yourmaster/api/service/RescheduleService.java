package com.yourmaster.api.service;

import com.yourmaster.api.model.RescheduleRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface RescheduleService {
    RescheduleRequest createRequest(UUID recordId, LocalDateTime newDateTime);
    void processRequest(UUID requestId, boolean accepted);
    List<RescheduleRequest> getRequestsForCurrentUser();
    List<String> getAvailableSlots(UUID recordId, String date);
    List<String> getAvailableDates(UUID recordId);
}