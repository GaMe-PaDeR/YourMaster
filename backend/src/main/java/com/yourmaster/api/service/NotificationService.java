package com.yourmaster.api.service;

import com.yourmaster.api.model.Notification;
import com.yourmaster.api.model.User;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.RescheduleRequest;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Page<Notification> getNotificationsForUser(UUID userId, Pageable pageable);
    long getUnreadCountForUser(UUID userId);
    void markAsRead(UUID notificationId, UUID userId);
    Notification createNotification(User user, String message, String title);
    void sendNewRecordNotification(UUID masterId, Record record);
    void sendReminderNotification(UUID userId, String message);
    void sendRecordCancellationNotification(UUID userId, String title, String message);
    void deleteNotification(UUID notificationId, UUID userId);
    void clearAllNotifications(UUID userId);
    void markAllAsRead(UUID userId);
    void sendRescheduleRequestNotification(User recipient, RescheduleRequest request);
    void sendRescheduleResponseNotification(User recipient, RescheduleRequest request);
}
