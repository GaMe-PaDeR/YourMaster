package com.yourmaster.api.dto;

import com.yourmaster.api.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDto {
    private UUID id;
    private String chatName;
    private Boolean isGroup;
    private String chatImage;
    private User createdBy;
    private List<User> participants;
    private MessageDto lastMessage;
    private Long unreadCount;
    private Long totalMessages;
} 