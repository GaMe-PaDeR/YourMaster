package com.yourmaster.api.config;

//import com.yourmaster.api.controller.NotificationController;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Configuration
@EnableScheduling
public class SchedulerConfig {

    @Autowired
    private RecordService recordService;

//    @Autowired
//    private NotificationController notificationController;

    @Scheduled(cron = "0 0 9 * * ?") // Каждый день в 9 утра
    public void sendDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // Напоминания для клиентов
        List<Record> clientRecords = recordService.getRecordsByDate(tomorrow);
        clientRecords.forEach(record -> {
            String message = String.format("Напоминание: завтра в %s у вас запись на %s",
                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")),
                record.getService().getTitle());

//            notificationController.sendReminderNotification(record.getClient().getId(), message);
        });

        // Напоминания для мастеров
        List<Record> masterRecords = recordService.getRecordsByDate(tomorrow);
        masterRecords.forEach(record -> {
            String message = String.format("Завтра у вас запись с %s %s на %s в %s",
                record.getClient().getFirstName(),
                record.getClient().getLastName(),
                record.getService().getTitle(),
                record.getRecordDate().format(DateTimeFormatter.ofPattern("HH:mm")));

//            notificationController.sendReminderNotification(record.getMaster().getId(), message);
        });
    }
}