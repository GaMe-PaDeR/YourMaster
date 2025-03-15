package com.yourmaster.api.controller;

import com.yourmaster.api.model.Notification;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.NotificationService;
import com.yourmaster.api.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    @InjectMocks
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMarkAsRead() {
        UUID notificationId = UUID.randomUUID();
        User user = new User();
        user.setId(UUID.randomUUID());

        when(userService.getCurrentUser()).thenReturn(user);

        ResponseEntity<Void> response = notificationController.markAsRead(notificationId);

        assertEquals(204, response.getStatusCodeValue());
    }

    @Test
    void testCreateNotification() {
        User user = new User();
        user.setId(UUID.randomUUID());

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());

        when(userService.getCurrentUser()).thenReturn(user);
        when(notificationService.createNotification(any(User.class), any(String.class), any(String.class))).thenReturn(notification);

        ResponseEntity<Notification> response = notificationController.createNotification("Test message", "Test title");

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(notification.getId(), response.getBody().getId());
    }
}
