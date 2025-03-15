package com.yourmaster.api.controller;

import com.yourmaster.api.dto.request.SingleChatRequest;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.ChatService;
import com.yourmaster.api.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ChatControllerTest {

    @Mock
    private ChatService chatService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ChatController chatController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateChat() {
        SingleChatRequest singleChatRequest = new SingleChatRequest();
        singleChatRequest.setRecipientId(UUID.randomUUID());

        User currentUser = new User();
        currentUser.setId(UUID.randomUUID());

        Chat chat = new Chat();
        chat.setId(UUID.randomUUID());

        when(userService.getCurrentUser()).thenReturn(currentUser);
        when(chatService.createChat(any(User.class), any(UUID.class))).thenReturn(chat);

        ResponseEntity<Chat> response = chatController.createChat(singleChatRequest);

        assertNotNull(response, "Response не должен быть null");
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Статус код должен быть 200");
        assertNotNull(response.getBody(), "Тело ответа не должно быть null");
        assertEquals(chat.getId(), response.getBody().getId(), "ID чата должен совпадать");
    }
}
