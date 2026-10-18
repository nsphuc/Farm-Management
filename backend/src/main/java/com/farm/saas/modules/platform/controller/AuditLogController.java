package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.AuditLogResponse;
import com.farm.saas.modules.platform.service.AuditLogQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/system/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Truy vấn sổ cái nhật ký kiểm toán bất biến của hệ thống")
public class AuditLogController {

    private final AuditLogQueryService auditLogQueryService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE')")
    @Operation(summary = "Truy vấn nhật ký kiểm toán bất biến",
            description = "Chỉ đọc 100%, phân trang tối đa 100 dòng, hỗ trợ lọc theo module, hành động, người dùng và khoảng thời gian")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogQueryService.queryAuditLogs(module, action, userId, fromDate, toDate, pageable));
    }
}
