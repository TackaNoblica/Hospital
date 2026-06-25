package com.careafter.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.Notification;
import com.careafter.model.User;
import com.careafter.repository.NotificationRepository;
import com.careafter.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<Notification> getNotificationsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public Notification markAsRead(Long notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getRecipient().getEmail().equals(email)) {
            throw new IllegalArgumentException("Notification does not belong to the current user");
        }

        notification.setIsRead(true);
        notification.setCreatedAt(notification.getCreatedAt() == null ? LocalDateTime.now() : notification.getCreatedAt());
        return notificationRepository.save(notification);
    }
}
