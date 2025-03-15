package com.yourmaster.api.model;

import com.yourmaster.api.enums.RescheduleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
public class RescheduleRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "record_id", nullable = false)
    private Record record;

    @Column(nullable = false)
    private LocalDateTime newDateTime;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RescheduleStatus status = RescheduleStatus.PENDING;
} 