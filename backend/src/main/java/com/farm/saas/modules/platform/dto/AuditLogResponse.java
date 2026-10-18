package com.farm.saas.modules.platform.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private Long tenantId;
    private Long userId;
    private String userFullName;
    private String action;
    private String module;
    private String endpoint;
    private String method;
    private String ipAddress;
    private String userAgent;
    private Integer statusCode;
    private Long executionTimeMs;
    private String traceId;
    private Object oldValue;
    private Object newValue;
    private Instant createdAt;
}
