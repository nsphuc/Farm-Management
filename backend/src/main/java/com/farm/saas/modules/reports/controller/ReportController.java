package com.farm.saas.modules.reports.controller;

import com.farm.saas.modules.reports.dto.*;
import com.farm.saas.modules.reports.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Trung tâm 5 báo cáo điều hành chuyên sâu")
public class ReportController {

    private final ReportService reportService;

    @GetMapping({"/api/v1/reports/executive-dashboard", "/api/v1/farms/{farmId}/reports/executive-dashboard"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT')")
    @Operation(summary = "Báo cáo bảng điều hành doanh nghiệp",
            description = "Tổng hợp doanh thu, chi phí lũy kế, lợi nhuận gộp, sản lượng thu hoạch, mùa vụ, đàn nuôi, định giá tồn kho và công nợ")
    public ResponseEntity<ExecutiveDashboardResponse> getExecutiveDashboard(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Integer fiscalYear) {
        return ResponseEntity.ok(reportService.getExecutiveDashboard(farmId, fiscalYear));
    }

    @GetMapping({"/api/v1/reports/inventory-aging", "/api/v1/farms/{farmId}/reports/inventory-aging"})
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Báo cáo tuổi thọ kho hàng & cảnh báo hạn dùng FEFO",
            description = "Phân nhóm tuổi tồn kho (0-30, 31-60, 61-90, >90 ngày) và danh sách các lô hàng cận hạn sử dụng")
    public ResponseEntity<InventoryAgingResponse> getInventoryAging(
            @PathVariable(required = false) Long farmId) {
        return ResponseEntity.ok(reportService.getInventoryAging(farmId));
    }

    @GetMapping({"/api/v1/reports/crop-cost-profit", "/api/v1/farms/{farmId}/reports/crop-cost-profit"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT')")
    @Operation(summary = "Báo cáo giá thành & lợi nhuận mùa vụ canh tác (Crop P&L)",
            description = "So sánh chi phí dự toán vs thực tế, giá thành đơn vị trên kg, doanh thu và biên lợi nhuận gộp")
    public ResponseEntity<CropCostProfitResponse> getCropCostProfit(
            @PathVariable(required = false) Long farmId) {
        return ResponseEntity.ok(reportService.getCropCostProfit(farmId));
    }

    @GetMapping({"/api/v1/reports/livestock-fcr", "/api/v1/farms/{farmId}/reports/livestock-fcr"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT')")
    @Operation(summary = "Báo cáo chuyển đổi thức ăn FCR & tỷ lệ nuôi sống",
            description = "Tính hệ số FCR = Tổng thức ăn tiêu thụ / Tổng tăng trọng và tỷ lệ nuôi sống của từng đàn nuôi")
    public ResponseEntity<LivestockFcrResponse> getLivestockFcr(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long groupId) {
        return ResponseEntity.ok(reportService.getLivestockFcr(farmId, groupId));
    }

    @GetMapping({"/api/v1/reports/debt-aging", "/api/v1/farms/{farmId}/reports/debt-aging"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT')")
    @Operation(summary = "Báo cáo phân tích tuổi nợ khách hàng (Debt Aging)",
            description = "Phân loại nợ phải thu và nợ phải trả theo khung thời gian (Trong hạn, quá hạn 1-30, 31-60, >90 ngày) và gắn cờ rủi ro nợ xấu")
    public ResponseEntity<DebtAgingResponse> getDebtAging(
            @PathVariable(required = false) Long farmId) {
        return ResponseEntity.ok(reportService.getDebtAging(farmId));
    }
}
