package com.yourmaster.api.service;

import com.yourmaster.api.dto.MessageDto;
import com.yourmaster.api.dto.request.SendMessageRequest;
import com.yourmaster.api.dto.response.UnreadMessagesResponse;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.model.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    Message sendMessage(SendMessageRequest request);

    Page<Message> findPagedMessagesByChatId(
            UUID chatId,
            User reqUser,
            int page,
            int size,
            String sort,
            String order
    );

    List<Message> findAllMessagesByChatId(UUID chatId);

    UnreadMessagesResponse getUnreadMessages();

    Message findMessageById(UUID messageId);

    UUID deleteMessageById(UUID messageId, User reqUser);

    Message changeMessage(UUID messageId, String newContent, User reqUser);

    Message markMessageAsRead(UUID messageId);

    Long countUnreadMessagesForCurrentUser();

    Long countUnreadMessagesForChat(UUID chatId, UUID userId);
}
