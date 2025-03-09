package com.yourmaster.api.service;

import com.yourmaster.api.model.Notification;
import com.yourmaster.api.model.User;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<Notification> getNotificationsForUser(UUID userId);
    long getUnreadCountForUser(UUID userId);
    void markAsRead(UUID notificationId, UUID userId);
    Notification createNotification(User user, String message);
}
