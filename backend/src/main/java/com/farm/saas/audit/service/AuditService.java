package com.farm.saas.audit.service;

import com.farm.saas.audit.entity.AuditLog;
import com.farm.saas.audit.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service ghi nhận nhật ký kiểm toán (Audit Log) theo thời gian thực.
 * Sử dụng transaction Propagation.REQUIRES_NEW để đảm bảo tính độc lập.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAudit(
            Long tenantId,
            Long userId,
            String action,
            String module,
            String endpoint,
            String method,
            String ipAddress,
            String userAgent,
            Integer statusCode,
            Long executionTimeMs,
            String traceId,
            String oldValue,
            String newValue
    ) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .action(action)
                    .module(module)
                    .endpoint(endpoint)
                    .method(method)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .statusCode(statusCode)
                    .executionTimeMs(executionTimeMs)
                    .traceId(traceId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Ghi nhận AuditLog thành công: Action={}, Module={}, User={}", action, module, userId);
        } catch (Exception e) {
            log.error("Lỗi khi ghi AuditLog: {}", e.getMessage(), e);
        }
    }
}
