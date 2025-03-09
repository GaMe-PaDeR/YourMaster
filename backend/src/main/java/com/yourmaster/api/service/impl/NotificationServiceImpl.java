package com.yourmaster.api.service.impl;

import com.yourmaster.api.model.Notification;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.NotificationRepository;
import com.yourmaster.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public List<Notification> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public long getUnreadCountForUser(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public void markAsRead(UUID notificationId, UUID userId) {
        Optional<Notification> optionalNotification = notificationRepository.findByIdAndUserId(notificationId, userId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setRead(true);
            notificationRepository.save(notification);
        } else {
            throw new RuntimeException("Notification not found");
        }
    }

    @Override
    public Notification createNotification(User user, String message) {
        Notification notification = Notification.builder()
            .user(user)
            .message(message)
            .read(false)
            .build();
        return notificationRepository.save(notification);
    }
}