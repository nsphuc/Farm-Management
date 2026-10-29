package com.farm.saas.modules.platform.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.farm.saas.modules.platform.dto.request.BroadcastNotificationRequest;
import com.farm.saas.modules.platform.dto.response.BroadcastNotificationResponse;
import com.farm.saas.modules.platform.service.PlatformNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformNotificationServiceImpl implements PlatformNotificationService {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> ALLOWED_TYPES = Set.of("SYSTEM", "ALERT", "WARNING", "INFO");

    @Override
    @Transactional
    public BroadcastNotificationResponse broadcast(BroadcastNotificationRequest request) {
        // 1. Chuẩn hóa Type tuân thủ check constraint chk_notifications_type
        String rawType = request.getType() != null ? request.getType().trim().toUpperCase() : "SYSTEM";
        String safeType = ALLOWED_TYPES.contains(rawType) ? rawType : "SYSTEM";

        boolean onlyOwners = request.getOnlyOwners() == null || Boolean.TRUE.equals(request.getOnlyOwners());
        Long targetTenantId = request.getTargetTenantId();

        // 2. Xây dựng câu query tìm người nhận hợp lệ
        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        if (onlyOwners) {
            sql.append("SELECT DISTINCT u.id AS user_id, u.tenant_id ")
               .append("FROM users u ")
               .append("JOIN tenants t ON u.tenant_id = t.id ")
               .append("JOIN user_roles ur ON u.id = ur.user_id ")
               .append("JOIN roles r ON ur.role_id = r.id ")
               .append("WHERE u.status = 'ACTIVE' ")
               .append("AND t.status = 'ACTIVE' ")
               .append("AND r.code = 'ROLE_FARM_OWNER' ");
        } else {
            sql.append("SELECT DISTINCT u.id AS user_id, u.tenant_id ")
               .append("FROM users u ")
               .append("JOIN tenants t ON u.tenant_id = t.id ")
               .append("WHERE u.status = 'ACTIVE' ")
               .append("AND t.status = 'ACTIVE' ");
        }

        if (targetTenantId != null) {
            sql.append("AND u.tenant_id = ? ");
            params.add(targetTenantId);
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());

        // 3. Khởi tạo danh sách Notifications và lưu vào cơ sở dữ liệu
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Instant now = Instant.now();
        List<Notification> notificationsToSave = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Long userId = ((Number) row.get("user_id")).longValue();
            Long tenantId = ((Number) row.get("tenant_id")).longValue();

            Notification notification = Notification.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .title(request.getTitle().trim())
                    .message(request.getMessage().trim())
                    .type(safeType)
                    .isRead(false)
                    .referenceType("PLATFORM_BROADCAST")
                    .referenceId(null)
                    .actionUrl(null)
                    .createdAt(now)
                    .createdBy(currentUserId)
                    .build();

            notificationsToSave.add(notification);
        }

        if (!notificationsToSave.isEmpty()) {
            notificationRepository.saveAll(notificationsToSave);
        }

        int recipientCount = notificationsToSave.size();
        log.info("Platform broadcast notification sent to {} recipients. Type: {}, Tenant: {}",
                recipientCount, safeType, targetTenantId != null ? targetTenantId : "ALL");

        // 4. Ghi nhận Audit Trail Event
        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(targetTenantId)
                .userId(currentUserId)
                .action("BROADCAST_NOTIFICATION")
                .module("PLATFORM")
                .endpoint("/api/v1/platform/notifications/broadcast")
                .method("POST")
                .newValue(String.format("Broadcast '%s' (%s) sent to %d recipients. OnlyOwners: %s",
                        request.getTitle(), safeType, recipientCount, onlyOwners))
                .build());

        return BroadcastNotificationResponse.builder()
                .message("Phát thông báo diện rộng thành công đến " + recipientCount + " tài khoản.")
                .recipientCount(recipientCount)
                .type(safeType)
                .targetTenantId(targetTenantId)
                .onlyOwners(onlyOwners)
                .broadcastAt(LocalDateTime.now())
                .build();
    }
}

