package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.finance.dto.CostAllocationRequest;
import com.farmsaas.modules.finance.dto.CostAllocationResponse;
import com.farmsaas.modules.finance.service.CostAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/cost-allocations", "/api/v1/farms/{farmId}/finance/cost-allocations"})
@RequiredArgsConstructor
public class CostAllocationController {

    private final CostAllocationService costAllocationService;

    @GetMapping("/by-expense/{expenseId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<CostAllocationResponse>>> getAllocationsByExpense(
            @PathVariable Long farmId,
            @PathVariable Long expenseId
    ) {
        List<CostAllocationResponse> list = costAllocationService.getAllocationsByExpense(farmId, expenseId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phân bổ theo chi phí thành công."));
    }

    @GetMapping("/by-season/{seasonId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<CostAllocationResponse>>> getAllocationsBySeason(
            @PathVariable Long farmId,
            @PathVariable Long seasonId
    ) {
        List<CostAllocationResponse> list = costAllocationService.getAllocationsBySeason(farmId, seasonId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phân bổ theo mùa vụ thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<CostAllocationResponse>> allocateCost(
            @PathVariable Long farmId,
            @Valid @RequestBody CostAllocationRequest request
    ) {
        CostAllocationResponse response = costAllocationService.allocateCost(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Phân bổ chi phí thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        costAllocationService.deleteAllocation(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Hủy phân bổ chi phí thành công."));
    }
}
