package com.yourmaster.api.service.impl;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.MessageDto;
import com.yourmaster.api.dto.request.SendMessageRequest;
import com.yourmaster.api.dto.response.UnreadMessagesResponse;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.MessageRepository;
import com.yourmaster.api.service.ChatService;
import com.yourmaster.api.service.MessageService;
import com.yourmaster.api.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class MessageServiceImpl implements MessageService {
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public Message sendMessage(SendMessageRequest request) {
        User user = userService.getUserById(request.getUserId());
        Chat chat = chatService.getChatById(request.getChatId());

        if (messageRepository.existsByContentAndSenderAndCreatedAtAfter(
            request.getContent(),
            user,
            LocalDateTime.now().minusMinutes(1)
        )) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Duplicate message");
        }

        Message message = Message.builder()
                .chat(chat)
                .sender(user)
                .content(request.getContent())
                .replyToMessageId(request.getReplyToMessageId())
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        List<Message> messages = findAllMessagesByChatId(chat.getId());
        chatService.updateMessageCount(chat.getId(), messages.size());

        return savedMessage;
    }

    @Override
    public Page<Message> findPagedMessagesByChatId(
            UUID chatId,
            User reqUser,
            int page,
            int size,
            String sort,
            String order
    ) {
        Chat chat = chatService.getChatById(chatId);
        int adjustedPage = (page > 0) ? page - 1 : 0;

        Sort sortType = order.equalsIgnoreCase("asc")
                ? Sort.by(sort).ascending()
                : Sort.by(sort).descending();

        PageRequest pageRequest = PageRequest.of(adjustedPage, size, sortType);
        Page<Message> pages = messageRepository.findByChat_Id(chatId, pageRequest);

        if (adjustedPage > pages.getTotalPages())
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    String.format(Constants.MESSAGE_PAGE_NOT_FOUND, pages.getTotalPages())
            );

        if (!chat.getParticipants().contains(reqUser)) {
            throw new ApiException(HttpStatus.FORBIDDEN, Constants.CHAT_NOT_CONTAINS_USER);
        }

        return pages;
    }

    @Override
    public List<Message> findAllMessagesByChatId(UUID chatId) {
        return messageRepository.findAllByChat_Id(chatId)
                .stream()
                .toList();
    }

    @Override
    public UnreadMessagesResponse getUnreadMessages() {
        UUID currentUserId = userService.getCurrentUser().getId();
        List<Chat> chats = chatService.findAllChatsByUserId(currentUserId);
        List<Message> unreadMessages = new ArrayList<>();

        chats.forEach(chat -> {
            List<Message> chatMessages = findAllMessagesByChatId(chat.getId())
                    .stream()
                    .filter(msg -> msg.getSender().getId() != currentUserId && !msg.isRead())
                    .toList();

            unreadMessages.addAll(chatMessages);
        });

        return UnreadMessagesResponse.builder()
                .messages(unreadMessages)
                .count(unreadMessages.size())
                .build();
    }

    @Override
    public Message findMessageById(UUID messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.MESSAGE_RESOURCE_NAME, Constants.ID_FIELD, messageId));
    }

    @Override
    @Transactional
    public UUID deleteMessageById(UUID messageId, User reqUser) {
        Message message = findMessageById(messageId);

        if (message.getSender().getId().equals(reqUser.getId())) {
            messageRepository.deleteById(message.getId());
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, Constants.PERMISSION_MESSAGE);
        }
        return message.getId();
    }

    @Override
    public Message changeMessage(UUID messageId, String newContent, User reqUser) {
        Message message = findMessageById(messageId);

        if (message.getSender().getId().equals(reqUser.getId())) {
            message.setContent(newContent);
            messageRepository.save(message);
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, Constants.PERMISSION_MESSAGE);
        }
        return message;
    }

    @Override
    @Transactional
    public Message markMessageAsRead(UUID messageId) {
        Message message = findMessageById(messageId);
        User currentUser = userService.getCurrentUser();
        Chat chat = message.getChat();
        
        // Проверка участия в чате
        if (!chat.getParticipants().contains(currentUser)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Нет доступа к сообщению");
        }
        
        // Обновляем все непрочитанные сообщения других пользователей в этом чате
        messageRepository.markAllMessagesAsReadInChat(
            chat.getId(), 
            currentUser.getId()
        );
        
        // Обновляем статус текущего сообщения (для обратной совместимости)
        message.setRead(true);
        return messageRepository.save(message);
    }

    @Override
    public Long countUnreadMessagesForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        return messageRepository.countUnreadMessagesForUser(currentUser);
    }

    @Override
    public Long countUnreadMessagesForChat(UUID chatId, UUID userId) {
        return messageRepository.countByChatIdAndSenderIdNotAndIsReadFalse(chatId, userId);
    }
}