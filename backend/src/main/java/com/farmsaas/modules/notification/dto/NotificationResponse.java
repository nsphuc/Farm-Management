package com.farmsaas.modules.notification.dto;

import com.farmsaas.common.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long tenantId;
    private Long recipientId;
    private String type;
    private String title;
    private String message;
    private String dataJson;
    private Boolean isRead;
    private Instant createdAt;

    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) {
            return null;
        }
        return NotificationResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .recipientId(entity.getRecipientId())
                .type(entity.getType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .dataJson(entity.getDataJson())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
