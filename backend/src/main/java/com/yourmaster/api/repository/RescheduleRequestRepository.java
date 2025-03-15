package com.yourmaster.api.repository;

import com.yourmaster.api.model.RescheduleRequest;
import com.yourmaster.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RescheduleRequestRepository extends JpaRepository<RescheduleRequest, UUID> {
    List<RescheduleRequest> findByRecord_ClientOrRecord_Master(User client, User master);
} 