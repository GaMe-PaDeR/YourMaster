package com.yourmaster.api.util.mappers;

import com.yourmaster.api.dto.ChatDto;
import com.yourmaster.api.dto.MessageDto;
import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.model.User;

import java.util.List;
import java.util.stream.Collectors;

public class ChatMapper {
    
    public static ChatDto toChatDto(Chat chat) {
        return ChatDto.builder()
            .id(chat.getId())
            .chatName(chat.getChatName())
            .isGroup(chat.getIsGroup())
            .chatImage(chat.getChatImage())
            .createdBy(chat.getCreatedBy())
            .participants(chat.getParticipants())
            .lastMessage(mapLastMessage(chat.getLastMessage()))
            .totalMessages(chat.getTotalMessages())
            .build();
    }

//    private static UserDto mapUser(User user) {
//        return UserMapper.userToUserDto(user);
//    }
//
//    private static List<UserDto> mapParticipants(List<User> participants) {
//        return participants.stream()
//            .map(UserMapper::userToUserDto)
//            .collect(Collectors.toList());
//    }

    private static MessageDto mapLastMessage(Message message) {
        if (message == null) return null;
        
        return MessageDto.builder()
            .id(message.getId())
            .content(message.getContent())
            .createdAt(message.getCreatedAt())
            .senderId(message.getSender().getId())
            .chatId(message.getChat().getId())
            .isRead(message.isRead())
            .build();
    }
} 