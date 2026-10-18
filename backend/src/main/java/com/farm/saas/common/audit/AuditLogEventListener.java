package com.farm.saas.common.audit;

import com.farm.saas.modules.platform.entity.AuditLog;
import com.farm.saas.modules.platform.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogEventListener {

    private final AuditLogRepository auditLogRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Async("auditTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuditTrailEvent(AuditTrailEvent event) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(event.getTenantId())
                    .userId(event.getUserId())
                    .action(event.getAction())
                    .module(event.getModule())
                    .endpoint(event.getEndpoint())
                    .method(event.getMethod())
                    .ipAddress(event.getIpAddress())
                    .userAgent(event.getUserAgent())
                    .statusCode(event.getStatusCode())
                    .executionTimeMs(event.getExecutionTimeMs())
                    .traceId(event.getTraceId())
                    .oldValue(ensureJson(event.getOldValue()))
                    .newValue(ensureJson(event.getNewValue()))
                    .createdAt(event.getCreatedAt())
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Successfully saved audit log for action: {} by user: {}", event.getAction(), event.getUserId());
        } catch (Exception ex) {
            log.error("Failed to asynchronously save audit log: {}", ex.getMessage(), ex);
        }
    }

    private String ensureJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            return trimmed;
        }
        try {
            return objectMapper.writeValueAsString(java.util.Collections.singletonMap("data", trimmed));
        } catch (Exception e) {
            return "{\"data\":\"" + trimmed.replace("\"", "\\\"") + "\"}";
        }
    }
}
