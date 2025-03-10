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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;

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

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount() {
        User currentUser = userService.getCurrentUser();
        long count = notificationService.getUnreadCountForUser(currentUser.getId());
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User currentUser = userService.getCurrentUser();
        Page<Notification> notifications = notificationService.getNotificationsForUser(
                currentUser.getId(), 
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(notifications);
    }

//    @GetMapping("/unread-count")
//    public ResponseEntity<Long> getUnreadNotificationCount() {
//        User currentUser = userService.getCurrentUser();
//        long count = notificationService.getUnreadCountForUser(currentUser.getId());
//        return ResponseEntity.ok(count);
//    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId) {
        User currentUser = userService.getCurrentUser();
        notificationService.markAsRead(notificationId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody String message, @RequestParam String title) {
        User currentUser = userService.getCurrentUser();
        Notification notification = notificationService.createNotification(currentUser, message, title);
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

    public void sendTestPushNotification(String message) {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getPushToken() != null) {
            expoNotificationService.sendNotification(
                currentUser.getPushToken(),
                "Тестовое уведомление",
                message
            );
        }
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID notificationId) {
        User currentUser = userService.getCurrentUser();
        notificationService.deleteNotification(notificationId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearAllNotifications() {
        User currentUser = userService.getCurrentUser();
        notificationService.clearAllNotifications(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = userService.getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}