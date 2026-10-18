package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.response.UnitCostReportResponse;
import com.farm.saas.modules.finance.service.FarmExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/costing")
@RequiredArgsConstructor
@Tag(name = "Costing", description = "Tính giá thành sản xuất đơn vị và phân tích cơ cấu chi phí")
public class CostingController {

    private final FarmExpenseService farmExpenseService;

    @GetMapping("/unit-cost")
    @PreAuthorize("hasAuthority('PERM_FINANCE_REPORT') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tính giá thành sản xuất đơn vị",
            description = "Tổng hợp toàn bộ chi phí trực tiếp và chi phí gián tiếp phân bổ chia cho tổng sản lượng thực tế")
    public ResponseEntity<UnitCostReportResponse> getUnitCost(
            @PathVariable Long farmId,
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        return ResponseEntity.ok(farmExpenseService.calculateUnitCost(farmId, targetType, targetId));
    }
}
