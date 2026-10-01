package com.farmsaas.modules.notification.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.notification.dto.NotificationResponse;
import com.farmsaas.modules.notification.dto.SendNotificationRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface NotificationService {

    /**
     * Creates and persists a notification, then broadcasts it in real-time
     * via WebSocket and SSE to the designated recipient.
     */
    NotificationResponse sendNotification(Long tenantId, SendNotificationRequest request);

    /**
     * Gets paginated notifications for the current authenticated user in current tenant.
     */
    PageResponse<NotificationResponse> getCurrentUserNotifications(Pageable pageable);

    /**
     * Gets total unread notifications count for the current authenticated user.
     */
    long getUnreadCount();

    /**
     * Marks a specific notification as read.
     */
    NotificationResponse markAsRead(Long id);

    /**
     * Marks all notifications as read for current authenticated user.
     */
    void markAllAsRead();

    /**
     * Subscribes to Server-Sent Events (SSE) stream for real-time notifications.
     */
    SseEmitter subscribeSse(Long userId, Long tenantId);
}
