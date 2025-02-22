package com.yourmaster.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RecordDto {
    private UUID recipientId;
    private UUID serviceId;
    private LocalDateTime recordDate;
}
