package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.finance.dto.BudgetRequest;
import com.farmsaas.modules.finance.dto.BudgetResponse;
import com.farmsaas.modules.finance.dto.BudgetVsActualResponse;
import com.farmsaas.modules.finance.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/budgets", "/api/v1/farms/{farmId}/finance/budgets"})
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<BudgetResponse>>> searchBudgets(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BudgetResponse> result = budgetService.searchBudgets(farmId, seasonId, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm ngân sách thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudgetById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        BudgetResponse response = budgetService.getBudgetById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết ngân sách thành công."));
    }

    @GetMapping("/vs-actual/{seasonId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BudgetVsActualResponse>> getBudgetVsActual(
            @PathVariable Long farmId,
            @PathVariable Long seasonId
    ) {
        BudgetVsActualResponse response = budgetService.getBudgetVsActual(farmId, seasonId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đối soát ngân sách và chi phí thực tế thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(
            @PathVariable Long farmId,
            @Valid @RequestBody BudgetRequest request
    ) {
        BudgetResponse response = budgetService.createBudget(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo dự toán ngân sách thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request
    ) {
        BudgetResponse response = budgetService.updateBudget(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật ngân sách thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        budgetService.deleteBudget(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa ngân sách thành công."));
    }
}
