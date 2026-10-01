package com.farmsaas.modules.notification.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.common.entity.Notification;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.common.exception.TenantAccessDeniedException;
import com.farmsaas.modules.notification.dto.NotificationResponse;
import com.farmsaas.modules.notification.dto.SendNotificationRequest;
import com.farmsaas.modules.notification.repository.NotificationRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Concurrent map to hold active SSE connections per userId
    private final Map<Long, List<SseEmitter>> sseEmitters = new ConcurrentHashMap<>();

    private Long getCurrentTenantId() {
        Long tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new TenantAccessDeniedException("Không xác định được ngữ cảnh Tenant hiện tại.");
        }
        return tenantId;
    }

    private Long getCurrentUserId() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("UNAUTHORIZED", "Người dùng chưa đăng nhập.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    @Override
    @Transactional
    public NotificationResponse sendNotification(Long tenantId, SendNotificationRequest request) {
        // 1. Lưu thông báo vào CSDL
        Notification notification = new Notification();
        notification.setTenantId(tenantId);
        notification.setRecipientId(request.getRecipientId());
        notification.setType(request.getType());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setDataJson(request.getDataJson());
        notification.setIsRead(false);

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.fromEntity(saved);

        // 2. Phát thông báo thời gian thực qua WebSocket (STOMP user destination)
        try {
            // Gửi tới /user/{recipientId}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                    request.getRecipientId().toString(),
                    "/queue/notifications",
                    response
            );
            log.debug("Đã gửi thông báo WebSocket tới User ID: {}", request.getRecipientId());
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo qua WebSocket: {}", e.getMessage());
        }

        // 3. Phát thông báo thời gian thực qua SSE Emitters (nếu client kết nối SSE)
        sendViaSse(request.getRecipientId(), response);

        log.info("Đã tạo và gửi thông báo [ID: {}] tới User [ID: {}] thuộc Tenant [{}]", 
                saved.getId(), request.getRecipientId(), tenantId);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getCurrentUserNotifications(Pageable pageable) {
        Long tenantId = getCurrentTenantId();
        Long userId = getCurrentUserId();

        Page<Notification> page = notificationRepository.findByRecipientIdAndTenantIdOrderByCreatedAtDesc(
                userId, tenantId, pageable
        );

        List<NotificationResponse> content = page.getContent().stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long tenantId = getCurrentTenantId();
        Long userId = getCurrentUserId();

        return notificationRepository.countByRecipientIdAndTenantIdAndIsReadFalse(userId, tenantId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Long tenantId = getCurrentTenantId();
        Long userId = getCurrentUserId();

        Notification notification = notificationRepository.findByIdAndRecipientIdAndTenantId(id, userId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Notification", id));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);
            log.debug("User [{}] đã đánh dấu đọc thông báo [{}]", userId, id);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        Long tenantId = getCurrentTenantId();
        Long userId = getCurrentUserId();

        int updatedCount = notificationRepository.markAllAsReadByRecipientIdAndTenantId(userId, tenantId);
        log.info("User [{}] đã đánh dấu đọc toàn bộ {} thông báo chưa đọc trong Tenant [{}]", userId, updatedCount, tenantId);
    }

    @Override
    public SseEmitter subscribeSse(Long userId, Long tenantId) {
        // 30 minutes timeout
        SseEmitter emitter = new SseEmitter(1800_000L);

        List<SseEmitter> userEmitterList = sseEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        userEmitterList.add(emitter);

        emitter.onCompletion(() -> {
            log.debug("SSE kết thúc cho user: {}", userId);
            userEmitterList.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE timeout cho user: {}", userId);
            userEmitterList.remove(emitter);
        });

        emitter.onError((e) -> {
            log.debug("SSE lỗi cho user: {}, {}", userId, e.getMessage());
            userEmitterList.remove(emitter);
        });

        // Gửi event khởi tạo xác nhận kết nối thành công
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("SSE notification stream connected successfully. User: " + userId));
        } catch (IOException e) {
            userEmitterList.remove(emitter);
            log.warn("Không thể gửi SSE handshake tới user: {}", userId);
        }

        return emitter;
    }

    private void sendViaSse(Long recipientId, NotificationResponse response) {
        List<SseEmitter> emitters = sseEmitters.get(recipientId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(response));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }
}
