package com.farm.saas.modules.notification.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private Instant readAt;
    private String referenceType;
    private Long referenceId;
    private String actionUrl;
    private Instant createdAt;
}
