package com.farm.saas.common.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTrailEvent {
    private Long tenantId;
    private Long userId;
    private String action;
    private String module;
    private String endpoint;
    private String method;
    private String ipAddress;
    private String userAgent;
    private Integer statusCode;
    private Long executionTimeMs;
    private String traceId;
    private String oldValue;
    private String newValue;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
