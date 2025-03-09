package com.yourmaster.api.controller;

import com.yourmaster.api.dto.ChatNotificationDto;
import com.yourmaster.api.service.NotificationService;
import com.yourmaster.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Collections;
import java.util.Map;
import java.util.List;
import com.yourmaster.api.model.Notification;
import com.yourmaster.api.service.ExpoNotificationService;
import com.yourmaster.api.model.User;
import com.yourmaster.api.model.Record;
import org.springframework.web.bind.annotation.RequestHeader;

@Controller
@RequestMapping("api/v1/notifications")
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @Autowired
    private ExpoNotificationService expoNotificationService;

    @MessageMapping("/notify")
    public void sendNotification(ChatNotificationDto notification) {
        messagingTemplate.convertAndSendToUser(
            notification.getRecipientId().toString(),
            "/queue/notifications",
            notification
        );

        User user = userService.getUserById(notification.getRecipientId());
        if (user.getPushToken() != null) {
            expoNotificationService.sendNotification(
                user.getPushToken(),
                "Новое уведомление",
                notification.getMessage()
            );
        }
    }

    public void sendReminderNotification(UUID userId, String message) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            ChatNotificationDto.builder()
                .message(message)
                .build()
        );

        User user = userService.getUserById(userId);
        if (user.getPushToken() != null) {
            expoNotificationService.sendNotification(
                user.getPushToken(),
                "Напоминание",
                message
            );
        }
    }

    public void sendNewRecordNotification(UUID masterId, Record record) {
        String message = String.format("Новая запись на %s от %s %s",
            record.getService().getTitle(),
            record.getClient().getFirstName(),
            record.getClient().getLastName());

        messagingTemplate.convertAndSendToUser(
            masterId.toString(),
            "/queue/notifications",
            ChatNotificationDto.builder()
                .message(message)
                .build()
        );

        User master = userService.getUserById(masterId);
        if (master.getPushToken() != null) {
            expoNotificationService.sendNotification(
                master.getPushToken(),
                "Новая запись",
                message
            );
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount() {
        User currentUser = userService.getCurrentUser();
        long count = notificationService.getUnreadCountForUser(currentUser.getId());
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User currentUser = userService.getCurrentUser();
        List<Notification> notifications = notificationService.getNotificationsForUser(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId) {
        User currentUser = userService.getCurrentUser();
        notificationService.markAsRead(notificationId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody String message) {
        User currentUser = userService.getCurrentUser();
        Notification notification = notificationService.createNotification(currentUser, message);
        return ResponseEntity.ok(notification);
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendPushNotification(
        @RequestParam String token,
        @RequestParam String title,
        @RequestParam String body) {

        expoNotificationService.sendNotification(token, title, body);
        return ResponseEntity.ok("Push notification sent successfully");
    }

    @PostMapping("/test-push")
    public ResponseEntity<String> sendTestPushNotification() {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getPushToken() == null) {
            return ResponseEntity.badRequest().body("Push token not registered");
        }

        try {
            expoNotificationService.sendNotification(
                currentUser.getPushToken(),
                "Тестовое уведомление",
                "Это тестовое push-уведомление!"
            );
            return ResponseEntity.ok("Test push notification sent");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send push notification: " + e.getMessage());
        }
    }

    @PostMapping("/register-token")
    public ResponseEntity<String> registerPushToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body("Token is required");
        }

        User currentUser = userService.getCurrentUser();
        currentUser.setPushToken(token);
        userService.saveUser(currentUser);

        return ResponseEntity.ok("Push token registered successfully");
    }
}