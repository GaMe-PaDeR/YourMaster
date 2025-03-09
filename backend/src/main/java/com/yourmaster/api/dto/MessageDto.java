package com.yourmaster.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    @NotNull
    @JsonProperty("chatId")
    private UUID chatId;
    
    @NotNull
    @JsonProperty("senderId")
    private UUID senderId;
    
    @NotBlank
    @JsonProperty("content")
    private String content;
    
    @JsonProperty("id")
    private UUID id;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    
    @JsonProperty("replyToMessageId")
    private UUID replyToMessageId;
    
    @JsonProperty("senderName")
    private String senderName;
    
    @JsonProperty("isRead")
    private boolean isRead;
} 