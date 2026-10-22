package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.ConfirmSettlementRequest;
import com.farm.saas.modules.finance.dto.response.CycleSettlementSummaryResponse;
import com.farm.saas.modules.finance.service.CycleSettlementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Cycle Profit Settlement", description = "Quy trình kết toán lợi nhuận chu kỳ sản xuất chuyển về Chủ đầu tư")
public class CycleSettlementController {

    private final CycleSettlementService cycleSettlementService;

    @GetMapping("/api/v1/finance/cycle-settlements")
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT') or hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Danh sách kết toán chu kỳ toàn chuỗi",
            description = "Lấy danh sách các đợt kết toán chu kỳ vận hành của tất cả trang trại, kèm doanh thu, chi phí, lợi nhuận ròng và VietQR Owner")
    public ResponseEntity<List<CycleSettlementSummaryResponse>> getCycleSettlements(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(cycleSettlementService.getCycleSettlements(farmId));
    }

    @GetMapping("/api/v1/farms/{farmId}/cycles/{cycleId}/settlement-summary")
    @PreAuthorize("(hasAuthority('PERM_FINANCE_REPORT') or hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết kết toán một chu kỳ",
            description = "Xem chi tiết đối soát bảng kê thu bán hàng, chi vận hành và mã VietQR tài khoản ngân hàng của Owner")
    public ResponseEntity<CycleSettlementSummaryResponse> getCycleSettlementSummary(
            @PathVariable Long farmId,
            @PathVariable Long cycleId) {
        return ResponseEntity.ok(cycleSettlementService.getCycleSettlementSummary(farmId, cycleId));
    }

    @PostMapping("/api/v1/farms/{farmId}/cycles/{cycleId}/confirm-settlement")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chủ đầu tư xác nhận nhận tiền kết toán & Chốt sổ chu kỳ",
            description = "Khóa sổ chu kỳ sang trạng thái CLOSED sau khi Owner nhận đủ lợi nhuận và gửi thông báo tới Ban quản lý trại")
    public ResponseEntity<CycleSettlementSummaryResponse> confirmSettlement(
            @PathVariable Long farmId,
            @PathVariable Long cycleId,
            @RequestBody(required = false) ConfirmSettlementRequest request) {
        return ResponseEntity.ok(cycleSettlementService.confirmSettlement(farmId, cycleId, request));
    }
}
