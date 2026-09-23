package com.remy.backend.controller;

import com.remy.backend.model.UserNotification;
import com.remy.backend.repository.UserNotificationRepository;
import com.remy.backend.service.TokenService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final UserNotificationRepository userNotificationRepository;
    private final TokenService tokenService;

    public NotificationController(UserNotificationRepository userNotificationRepository, TokenService tokenService) {
        this.userNotificationRepository = userNotificationRepository;
        this.tokenService = tokenService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to see notifications."));
        }

        List<Map<String, Object>> notifications = userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId.get())
                .stream()
                .map(this::toMap)
                .toList();

        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to update notifications."));
        }

        UserNotification notification = userNotificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

        if (!notification.getUser().getId().equals(userId.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only read your own notifications."));
        }

        notification.setRead(true);
        UserNotification saved = userNotificationRepository.save(notification);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "read", true, "message", saved.getMessage()));
    }

    private Map<String, Object> toMap(UserNotification notification) {
        return Map.of(
                "id", notification.getId(),
                "message", notification.getMessage(),
                "type", notification.getType().name(),
                "read", notification.isRead(),
                "createdAt", notification.getCreatedAt().toString());
    }
}
