package com.yourmaster.api.service.impl;

import com.yourmaster.api.dto.ChatNotificationDto;
import com.yourmaster.api.enums.NotificationType;
import com.yourmaster.api.enums.RescheduleStatus;
import com.yourmaster.api.model.Notification;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.NotificationRepository;
import com.yourmaster.api.service.ExpoNotificationService;
import com.yourmaster.api.service.NotificationService;
import com.yourmaster.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.yourmaster.api.controller.NotificationController;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import com.yourmaster.api.model.Record;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.RescheduleRequest;
import com.yourmaster.api.enums.NotificationType;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ExpoNotificationService expoNotificationService;

    // @Override
    // public List<Notification> getNotificationsForUser(UUID userId) {
    //     return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    // }

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
    public Notification createNotification(User user, String message, String title) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @Override
    public void sendNewRecordNotification(UUID masterId, Record record) {
        String message = String.format("Новая запись на %s от %s %s",
                record.getService().getTitle(),
                record.getClient().getFirstName(),
                record.getClient().getLastName());

        // Сохраняем уведомление в БД
        Notification notification = createNotification(
                userService.getUserById(masterId),
                message,
                "Новая запись"
        );

        // Отправляем через WebSocket
        messagingTemplate.convertAndSendToUser(
                masterId.toString(),
                "/queue/notifications",
                ChatNotificationDto.builder()
                        .id(notification.getId())
                        .message(message)
                        .build()
        );

        // Отправляем push-уведомление
        User master = userService.getUserById(masterId);
        if (master.getPushToken() != null) {
            expoNotificationService.sendNotification(
                    master.getPushToken(),
                    "Новая запись",
                    message
            );
        }
    }

    @Override
    public void sendReminderNotification(UUID userId, String message) {
        // Сохраняем уведомление в БД
        Notification notification = createNotification(
                userService.getUserById(userId),
                message,
                "Напоминание"
        );

        // Отправляем через WebSocket
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                ChatNotificationDto.builder()
                        .id(notification.getId())
                        .message(message)
                        .build()
        );

        // Отправляем push-уведомление
        User user = userService.getUserById(userId);
        if (user.getPushToken() != null) {
            expoNotificationService.sendNotification(
                    user.getPushToken(),
                    "Напоминание",
                    message
            );
        }
    }

    @Override
    public void sendRecordCancellationNotification(UUID userId, String title, String message) {
        // Создаем уведомление в базе данных
        Notification notification = new Notification();
        notification.setUser(userService.getUserById(userId));
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notificationRepository.save(notification);

        // Отправляем push-уведомление через Expo
        User user = userService.getUserById(userId);
        if (user.getPushToken() != null) {
            expoNotificationService.sendNotification(user.getPushToken(), title, message);
        }
    }

    @Override
    public Page<Notification> getNotificationsForUser(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    @Override
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You can only delete your own notifications");
        }
        
        notificationRepository.delete(notification);
    }

    @Override
    public void clearAllNotifications(UUID userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    @Override
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    public void sendRescheduleRequestNotification(User recipient, RescheduleRequest request) {
        String title = "Запрос на перенос записи";
        String message = String.format("Запрос на перенос записи на %s %s",
                request.getNewDateTime().toLocalDate(),
                request.getNewDateTime().toLocalTime());
        
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(NotificationType.RESCHEDULE_REQUEST);
        notification.setRelatedId(request.getId().toString());
        
        notificationRepository.save(notification);
        
        // Отправка push-уведомления
        if (recipient.getPushToken() != null) {
            expoNotificationService.sendNotification(
                recipient.getPushToken(),
                title,
                message
            );
        }
    }

    @Override
    public void sendRescheduleResponseNotification(User recipient, RescheduleRequest request) {
        String title = "Ответ на перенос записи";
        String status = request.getStatus() == RescheduleStatus.ACCEPTED ?
                "принят" : "отклонен";
        String message = String.format("Ваш запрос на перенос записи %s", status);
        
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setUser(recipient);
        notification.setMessage(message);
        notification.setType(NotificationType.RESCHEDULE_RESPONSE);
        notification.setRelatedId(request.getId().toString());
        
        notificationRepository.save(notification);
        
        // Отправка push-уведомления
        if (recipient.getPushToken() != null) {
            expoNotificationService.sendNotification(
                recipient.getPushToken(),
                "Ответ на запрос переноса",
                message
            );
        }
    }
}