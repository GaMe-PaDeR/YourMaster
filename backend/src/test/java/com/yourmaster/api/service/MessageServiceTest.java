package com.yourmaster.api.service;

import com.yourmaster.api.dto.request.SendMessageRequest;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.MessageRepository;
import com.yourmaster.api.service.impl.MessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatService chatService;

    @Mock
    private UserService userService;

    @InjectMocks
    private MessageServiceImpl messageService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSendMessage() {
        SendMessageRequest request = new SendMessageRequest();
        request.setChatId(UUID.randomUUID());
        request.setContent("Test message");

        User user = new User();
        user.setId(UUID.randomUUID());

        Chat chat = new Chat();
        chat.setId(request.getChatId());

        Message message = new Message();
        message.setId(UUID.randomUUID());

        when(userService.getCurrentUser()).thenReturn(user);
        when(chatService.getChatById(any(UUID.class))).thenReturn(chat);
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        Message sentMessage = messageService.sendMessage(request);

        assertNotNull(sentMessage);
        assertNotNull(sentMessage.getId());
    }
}
