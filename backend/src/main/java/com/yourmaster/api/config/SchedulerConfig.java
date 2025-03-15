package com.yourmaster.api.config;

import com.yourmaster.api.controller.NotificationController;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.NotificationService;
import com.yourmaster.api.service.RecordService;
import com.yourmaster.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Configuration
@EnableScheduling
public class SchedulerConfig {

    @Autowired
    private RecordService recordService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @Scheduled(cron = "0 0 * * * *") // Каждый час
    public void checkReminders() {
        setSecurityContext();
        LocalDateTime now = LocalDateTime.now();

        // Проверка напоминаний за 3 дня
        check3DaysReminders(now);

        // Проверка напоминаний за 1 день
        check1DayReminders(now);

        // Проверка напоминаний за 1 час
        check1HourReminders(now);
    }

    private void check3DaysReminders(LocalDateTime now) {
        LocalDate threeDaysLater = now.toLocalDate().plusDays(3);
        List<Record> clientRecords3Days = recordService.getRecordsByDate(threeDaysLater);
        clientRecords3Days.forEach(record -> {
            String message = String.format("Напоминание: через 3 дня в %s у вас запись на %s",
                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")),
                record.getService().getTitle());
            notificationService.sendReminderNotification(record.getClient().getId(), message);
        });
    }

    private void check1DayReminders(LocalDateTime now) {
        LocalDate tomorrow = now.toLocalDate().plusDays(1);
        List<Record> clientRecords1Day = recordService.getRecordsByDate(tomorrow);
        clientRecords1Day.forEach(record -> {
            String message = String.format("Напоминание: завтра в %s у вас запись на %s",
                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")),
                record.getService().getTitle());
            notificationService.sendReminderNotification(record.getClient().getId(), message);
        });
    }

    private void check1HourReminders(LocalDateTime now) {
        List<Record> clientRecords1Hour = recordService.getRecordsBetweenDates(
            now.plusHours(1).minusMinutes(5), 
            now.plusHours(1).plusMinutes(5)
        );
        clientRecords1Hour.forEach(record -> {
            String message = String.format("Напоминание: через 1 час у вас запись на %s",
                record.getService().getTitle());
            notificationService.sendReminderNotification(record.getClient().getId(), message);
        });
    }

    // Напоминания для мастеров (остаются ежедневно в 20:00)
    @Scheduled(cron = "0 0 20 * * ?") // Каждый день в 20:00
    public void sendMasterReminders() {
        setSecurityContext();
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Record> masterRecords = recordService.getRecordsByDate(tomorrow);
        masterRecords.forEach(record -> {
            String message = String.format("Завтра у вас запись с %s %s на %s в %s",
                record.getClient().getFirstName(),
                record.getClient().getLastName(),
                record.getService().getTitle(),
                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")));
            notificationService.sendReminderNotification(record.getMaster().getId(), message);
        });
    }

//    @Scheduled(cron = "${notification.test.cron:0 9 18 * * ?}") // По умолчанию в 17:55
//    public void sendTestNotification() {
//        setSecurityContext();
//
//        LocalDate tomorrow = LocalDate.now().plusDays(1);
//        List<Record> records = recordService.getRecordsByDate(tomorrow);
//
//        if (!records.isEmpty()) {
//            Record record = records.get(0);
//            String message = String.format("Тестовое уведомление: завтра в %s у вас запись на %s",
//                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")),
//                record.getService().getTitle());
//
//            notificationService.sendReminderNotification(record.getMaster().getId(), message);
//        }
//    }

    private void setSecurityContext() {
        // Получаем системного пользователя (например, пользователя с email "system@yourmaster.com")
        User systemUser = userService.getUserByEmail("system@yourmaster.com");

        // Создаем аутентификацию для системного пользователя
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(systemUser, null, systemUser.getAuthorities());

        // Устанавливаем контекст безопасности
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}