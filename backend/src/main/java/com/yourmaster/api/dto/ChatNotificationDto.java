package com.yourmaster.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatNotificationDto {
    private UUID id;

    @Nullable
    private UUID replyToMessageId;

    private UUID senderId;

    private UUID chatId;

    private UUID recipientId;

    private String content;

    private LocalDateTime timestamp;

    private String message;
}
