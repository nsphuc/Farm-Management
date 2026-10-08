package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.finance.dto.UnitCostCalculationResponse;
import com.farmsaas.modules.finance.service.CostCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/cost-calculation", "/api/v1/farms/{farmId}/finance/cost-calculation"})
@RequiredArgsConstructor
public class CostCalculationController {

    private final CostCalculationService costCalculationService;

    @GetMapping("/season/{seasonId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<UnitCostCalculationResponse>> calculateSeasonCost(
            @PathVariable Long farmId,
            @PathVariable Long seasonId
    ) {
        UnitCostCalculationResponse response = costCalculationService.calculateSeasonUnitCost(farmId, seasonId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tính toán giá thành vụ mùa thành công."));
    }

    @GetMapping("/herd/{herdId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<UnitCostCalculationResponse>> calculateHerdCost(
            @PathVariable Long farmId,
            @PathVariable Long herdId
    ) {
        UnitCostCalculationResponse response = costCalculationService.calculateHerdUnitCost(farmId, herdId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tính toán giá thành đàn chăn nuôi thành công."));
    }
}
