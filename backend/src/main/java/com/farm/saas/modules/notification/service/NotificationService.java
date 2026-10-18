package com.farm.saas.modules.notification.service;

import com.farm.saas.modules.notification.dto.NotificationResponse;
import com.farm.saas.modules.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    Notification sendNotification(Long tenantId, Long userId, String title, String message, String type, String referenceType, Long referenceId, String actionUrl);

    Page<NotificationResponse> getUserNotifications(Long userId, Boolean isRead, String type, Pageable pageable);

    NotificationResponse markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);
}
