package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.finance.dto.response.BudgetDetailResponse;
import com.farm.saas.modules.finance.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Dự toán ngân sách nông trại và quản lý định mức chi phí")
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách kế hoạch ngân sách", description = "Truy vấn danh sách ngân sách có phân trang")
    public ResponseEntity<Page<BudgetDetailResponse>> getBudgets(
            @PathVariable Long farmId,
            @PageableDefault(sort = "fiscalYear", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(budgetService.getBudgets(farmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết kế hoạch ngân sách", description = "Xem chi tiết dự toán và tình hình giải ngân theo từng khoản mục chi phí")
    public ResponseEntity<BudgetDetailResponse> getBudgetById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo mới kế hoạch ngân sách", description = "Thiết lập dự toán ngân sách cho năm tài chính kèm các dòng định mức chi phí")
    public ResponseEntity<BudgetDetailResponse> createBudget(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateBudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.createBudget(farmId, request));
    }
}
