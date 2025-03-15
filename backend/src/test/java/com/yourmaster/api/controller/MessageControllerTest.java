package com.yourmaster.api.controller;

import com.yourmaster.api.dto.request.SendMessageRequest;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.service.MessageService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class MessageControllerTest {

    @Mock
    private MessageService messageService;

    @Mock
    private UserService userService;

    @InjectMocks
    private MessageController messageController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMarkMessageAsRead() {
        UUID messageId = UUID.randomUUID();
        Message message = new Message();
        message.setId(messageId);

        when(messageService.markMessageAsRead(any(UUID.class))).thenReturn(message);

        ResponseEntity<Message> response = messageController.markMessageAsRead(messageId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(messageId, response.getBody().getId());
    }
}
