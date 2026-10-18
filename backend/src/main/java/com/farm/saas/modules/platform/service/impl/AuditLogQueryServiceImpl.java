package com.farm.saas.modules.platform.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.platform.dto.AuditLogResponse;
import com.farm.saas.modules.platform.entity.AuditLog;
import com.farm.saas.modules.platform.repository.AuditLogRepository;
import com.farm.saas.modules.platform.service.AuditLogQueryService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogQueryServiceImpl implements AuditLogQueryService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private final Map<Long, String> userNameCache = new ConcurrentHashMap<>();

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> queryAuditLogs(
            String module,
            String action,
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable) {

        Long tenantId = SecurityUtils.getCurrentTenantId();

        // Capped page size at 100
        Pageable effectivePageable = pageable;
        if (pageable.getPageSize() > 100) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), 100, pageable.getSort());
        }

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (tenantId != null) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (module != null && !module.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("module")), module.toUpperCase()));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("action")), action.toUpperCase()));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (fromDate != null) {
                Instant start = fromDate.atStartOfDay(ZoneOffset.UTC).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }
            if (toDate != null) {
                Instant end = toDate.atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> logPage = auditLogRepository.findAll(spec, effectivePageable);
        return logPage.map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        String userFullName = null;
        if (log.getUserId() != null) {
            userFullName = userNameCache.computeIfAbsent(log.getUserId(), id ->
                    userRepository.findById(id).map(User::getFullName).orElse(null));
        }

        Object parsedOldValue = parseJson(log.getOldValue());
        Object parsedNewValue = parseJson(log.getNewValue());

        return AuditLogResponse.builder()
                .id(log.getId())
                .tenantId(log.getTenantId())
                .userId(log.getUserId())
                .userFullName(userFullName)
                .action(log.getAction())
                .module(log.getModule())
                .endpoint(log.getEndpoint())
                .method(log.getMethod())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .statusCode(log.getStatusCode())
                .executionTimeMs(log.getExecutionTimeMs())
                .traceId(log.getTraceId())
                .oldValue(parsedOldValue)
                .newValue(parsedNewValue)
                .createdAt(log.getCreatedAt())
                .build();
    }

    private Object parseJson(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(jsonStr, Object.class);
        } catch (Exception e) {
            return jsonStr;
        }
    }
}
