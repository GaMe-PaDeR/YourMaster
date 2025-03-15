package com.yourmaster.api.service;

import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.ChatRepository;
import com.yourmaster.api.service.impl.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ChatServiceImpl chatService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateChat() {
        User user = new User();
        user.setId(UUID.randomUUID());

        Chat chat = new Chat();
        chat.setId(UUID.randomUUID());

        when(userService.getUserById(any(UUID.class))).thenReturn(user);
        when(chatRepository.save(any(Chat.class))).thenReturn(chat);

        Chat createdChat = chatService.createChat(user, UUID.randomUUID());

        assertNotNull(createdChat);
        assertNotNull(createdChat.getId());
    }
}
