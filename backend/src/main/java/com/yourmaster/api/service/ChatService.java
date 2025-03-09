package com.yourmaster.api.service;

import com.yourmaster.api.dto.request.GroupChatRequest;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatService {
    Chat createChat(User sender, UUID recipientId) throws ResourceNotFoundException;

    Chat getChatById(UUID chatId) throws ResourceNotFoundException;

    List<Chat> findAllChatsByUserId(UUID userId) throws ResourceNotFoundException;

    Chat createGroup(GroupChatRequest req, User creator);

    Chat addUserToGroup(UUID chatId, UUID userId) throws ResourceNotFoundException;

    Chat removeFromGroup(UUID chatId, UUID userId) throws ResourceNotFoundException;

    Chat renameGroup(UUID chatId, String groupName, User user);

    UUID deleteChat(UUID chatId) throws ResourceNotFoundException;

    void updateMessageCount(UUID chatId, long messageCount);

    Long getTotalUnreadMessages(UUID userId);

    Optional<Chat> findSingleChatByUsers(User user1, User user2);

    Long getChatsWithUnreadMessages(UUID userId);
}
