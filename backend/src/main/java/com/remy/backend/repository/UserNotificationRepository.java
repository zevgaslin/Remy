package com.remy.backend.repository;

import com.remy.backend.model.NotificationType;
import com.remy.backend.model.UserNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserNotification> findByUserIdAndMessageAndType(Long userId, String message, NotificationType type);
}
