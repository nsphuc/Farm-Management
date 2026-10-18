package com.farm.saas.modules.platform.service;

import com.farm.saas.modules.platform.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AuditLogQueryService {

    Page<AuditLogResponse> queryAuditLogs(
            String module,
            String action,
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable);
}
