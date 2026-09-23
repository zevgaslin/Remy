package com.remy.backend.service;

import com.remy.backend.model.Ingredient;
import com.remy.backend.model.NotificationType;
import com.remy.backend.model.User;
import com.remy.backend.model.UserNotification;
import com.remy.backend.repository.UserNotificationRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final UserNotificationRepository userNotificationRepository;

    public NotificationService(UserNotificationRepository userNotificationRepository) {
        this.userNotificationRepository = userNotificationRepository;
    }

    @Transactional
    public void maybeCreateExpiryNotification(Ingredient ingredient) {
        if (ingredient == null || ingredient.getOwner() == null || ingredient.getExpirationDate() == null) {
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate expirationDate = ingredient.getExpirationDate();
        long daysLeft = ChronoUnit.DAYS.between(today, expirationDate);

        String message;
        NotificationType type;

        if (daysLeft < 0) {
            message = "Your " + ingredient.getName() + " expired on " + expirationDate + ". Throw it out or use it today.";
            type = NotificationType.EXPIRED;
        } else if (daysLeft <= 3) {
            message = "Your " + ingredient.getName() + " expires in " + daysLeft + " day(s). Use it soon.";
            type = NotificationType.EXPIRING_SOON;
        } else {
            return;
        }

        User user = ingredient.getOwner();
        if (userNotificationRepository.findByUserIdAndMessageAndType(user.getId(), message, type).isEmpty()) {
            UserNotification notification = new UserNotification();
            notification.setUser(user);
            notification.setType(type);
            notification.setMessage(message);
            notification.setRead(false);
            userNotificationRepository.save(notification);
        }
    }
}
