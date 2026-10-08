package com.farmsaas.modules.analytics.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.analytics.dto.*;
import com.farmsaas.modules.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/farms/{farmId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/executive-summary")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ExecutiveSummaryDTO>> getExecutiveSummary(@PathVariable Long farmId) {
        ExecutiveSummaryDTO summary = analyticsService.getExecutiveSummary(farmId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy tổng quan điều hành thành công."));
    }

    @GetMapping("/production")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId) and hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<ProductionYieldReportDTO>> getProductionYieldReport(
            @PathVariable Long farmId,
            @RequestParam(required = false) Integer year
    ) {
        ProductionYieldReportDTO report = analyticsService.getProductionYieldReport(farmId, year);
        return ResponseEntity.ok(ApiResponse.success(report, "Lấy báo cáo sản xuất & năng suất thành công."));
    }

    @GetMapping("/inventory")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId) and hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_WAREHOUSE_KEEPER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InventoryReportDTO>> getInventoryReport(@PathVariable Long farmId) {
        InventoryReportDTO report = analyticsService.getInventoryReport(farmId);
        return ResponseEntity.ok(ApiResponse.success(report, "Lấy báo cáo kho & vật tư thành công."));
    }

    @GetMapping("/financials")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId) and hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<FinancialPLReportDTO>> getFinancialPLReport(
            @PathVariable Long farmId,
            @RequestParam(required = false) Integer year
    ) {
        FinancialPLReportDTO report = analyticsService.getFinancialPLReport(farmId, year);
        return ResponseEntity.ok(ApiResponse.success(report, "Lấy báo cáo tài chính P&L & ROI thành công."));
    }

    @GetMapping("/alerts")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<List<EarlyAlertDTO>>> getEarlyAlerts(@PathVariable Long farmId) {
        List<EarlyAlertDTO> alerts = analyticsService.getEarlyAlerts(farmId);
        return ResponseEntity.ok(ApiResponse.success(alerts, "Lấy danh sách cảnh báo sớm thành công."));
    }

    @GetMapping("/export")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId) and hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable Long farmId,
            @RequestParam(defaultValue = "financials") String type,
            @RequestParam(defaultValue = "csv") String format
    ) throws IOException {
        byte[] data = analyticsService.exportReportData(farmId, type, format);
        String filename = String.format("bao_cao_%s_%s_%s.csv", type, farmId, LocalDate.now());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }
}
