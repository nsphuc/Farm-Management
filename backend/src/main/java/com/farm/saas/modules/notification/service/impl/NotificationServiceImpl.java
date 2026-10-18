package com.farm.saas.modules.notification.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.modules.notification.dto.NotificationResponse;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Notification sendNotification(Long tenantId, Long userId, String title, String message, String type, String referenceType, Long referenceId, String actionUrl) {
        Notification notification = Notification.builder()
                .tenantId(tenantId)
                .userId(userId)
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .isRead(false)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .actionUrl(actionUrl)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(userId)
                .build();
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Long userId, Boolean isRead, String type, Pageable pageable) {
        Page<Notification> page;
        if (isRead != null && type != null && !type.isBlank()) {
            page = notificationRepository.findByUserIdAndIsReadAndType(userId, isRead, type, pageable);
        } else if (isRead != null) {
            page = notificationRepository.findByUserIdAndIsRead(userId, isRead, pageable);
        } else if (type != null && !type.isBlank()) {
            page = notificationRepository.findByUserIdAndType(userId, type, pageable);
        } else {
            page = notificationRepository.findByUserId(userId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Notification not found: " + notificationId));
        if (!notification.getUserId().equals(userId)) {
            throw new BusinessException("FORBIDDEN", "Notification does not belong to user");
        }
        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(Instant.now());
            notification.setUpdatedAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, Instant.now());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .actionUrl(n.getActionUrl())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
