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
@RequestMapping({"/api/v1/farms/{farmId}/budgets", "/api/v1/budgets"})
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Dự toán ngân sách nông trại và quản lý định mức chi phí")
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách kế hoạch ngân sách", description = "Truy vấn danh sách ngân sách có phân trang")
    public ResponseEntity<Page<BudgetDetailResponse>> getBudgets(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(name = "farmId", required = false) Long paramFarmId,
            @PageableDefault(sort = "fiscalYear", direction = Sort.Direction.DESC) Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId :
                (paramFarmId != null && paramFarmId > 0) ? paramFarmId : filterFarmId;
        return ResponseEntity.ok(budgetService.getBudgets(targetFarmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Chi tiết kế hoạch ngân sách", description = "Xem chi tiết dự toán và tình hình giải ngân theo từng khoản mục chi phí")
    public ResponseEntity<BudgetDetailResponse> getBudgetById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_REPORT', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Tạo mới hoặc phê duyệt ngân sách", description = "Thiết lập dự toán ngân sách cho năm tài chính kèm các dòng định mức chi phí")
    public ResponseEntity<BudgetDetailResponse> createBudget(
            @PathVariable(required = false) Long farmId,
            @Valid @RequestBody CreateBudgetRequest request) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : request.getFarmId();
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.createBudget(targetFarmId, request));
    }

    @PostMapping({"/{id}/approve", "/{id}/confirm"})
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_REPORT', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.isFarmManagerOrOwner(#farmId))")
    @Operation(summary = "Phê duyệt kế hoạch ngân sách", description = "Giám đốc trang trại hoặc Chủ đầu tư phê duyệt ngân sách chuyển sang ACTIVE")
    public ResponseEntity<BudgetDetailResponse> approveBudget(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(budgetService.updateBudgetStatus(farmId, id, "ACTIVE"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_REPORT', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.isFarmManagerOrOwner(#farmId))")
    @Operation(summary = "Phê duyệt hoặc thay đổi trạng thái ngân sách", description = "Phê duyệt ngân sách (status = ACTIVE)")
    public ResponseEntity<BudgetDetailResponse> updateBudgetStatus(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(budgetService.updateBudgetStatus(farmId, id, status));
    }

    @PostMapping({"/{id}/reject", "/{id}/cancel"})
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_REPORT', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.isFarmManagerOrOwner(#farmId))")
    @Operation(summary = "Từ chối kế hoạch ngân sách", description = "Chuyển trạng thái ngân sách sang REVISED (yêu cầu lập lại) hoặc CLOSED")
    public ResponseEntity<BudgetDetailResponse> rejectBudget(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id,
            @RequestParam(defaultValue = "REVISED") String status) {
        return ResponseEntity.ok(budgetService.updateBudgetStatus(farmId, id, status));
    }
}
