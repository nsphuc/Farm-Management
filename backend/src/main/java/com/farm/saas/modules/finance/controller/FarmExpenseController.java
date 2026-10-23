package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.AllocateCostRequest;
import com.farm.saas.modules.finance.dto.request.CreateFarmExpenseRequest;
import com.farm.saas.modules.finance.dto.response.FarmExpenseDetailResponse;
import com.farm.saas.modules.finance.service.FarmExpenseService;
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

import com.farm.saas.modules.finance.dto.response.MultiFarmExpenseSummaryResponse;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/expenses", "/api/v1/expenses"})
@RequiredArgsConstructor
@Tag(name = "Farm Expenses", description = "Quản lý tập hợp chi phí vận hành nông trại và phân bổ đa đối tượng")
public class FarmExpenseController {

    private final FarmExpenseService farmExpenseService;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách chi phí nông trại", description = "Lấy danh sách các khoản chi phí có phân trang")
    public ResponseEntity<Page<FarmExpenseDetailResponse>> getExpenses(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(name = "farmId", required = false) Long paramFarmId,
            @RequestParam(required = false) Long operationalCycleId,
            @PageableDefault(sort = "expenseDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId :
                (paramFarmId != null && paramFarmId > 0) ? paramFarmId : filterFarmId;
        return ResponseEntity.ok(farmExpenseService.getExpenses(targetFarmId, operationalCycleId, pageable));
    }

    @GetMapping("/summary/multi-farm")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Bảng thống kê và so sánh chi phí từng trang trại", description = "Tổng hợp chi phí theo 4 nguồn, tổng chi và giá thành đơn vị giữa các trại")
    public ResponseEntity<MultiFarmExpenseSummaryResponse> getMultiFarmExpenseSummary(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(name = "farmId", required = false) Long paramFarmId,
            @RequestParam(required = false) Long operationalCycleId) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId :
                (paramFarmId != null && paramFarmId > 0) ? paramFarmId : filterFarmId;
        return ResponseEntity.ok(farmExpenseService.getMultiFarmExpenseSummary(targetFarmId, operationalCycleId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Chi tiết khoản chi phí", description = "Lấy chi tiết một khoản chi phí kèm các phân bổ")
    public ResponseEntity<FarmExpenseDetailResponse> getExpenseById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(farmExpenseService.getExpenseById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Ghi nhận chi phí vận hành", description = "Tạo mới khoản chi phí, tự động ghi nhận ngân sách và cảnh báo 85% hạn mức nếu xác nhận")
    public ResponseEntity<FarmExpenseDetailResponse> createExpense(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateFarmExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmExpenseService.createExpense(farmId, request));
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Phân bổ chi phí đa đối tượng", description = "Phân bổ chi phí vào mùa vụ, đàn nuôi hoặc khu vực sản xuất với chốt chặn toán học")
    public ResponseEntity<FarmExpenseDetailResponse> allocateCost(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody AllocateCostRequest request) {
        return ResponseEntity.ok(farmExpenseService.allocateCost(farmId, id, request));
    }

    @PostMapping({"/{id}/confirm", "/{id}/approve"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_EXPENSE') and @farmSecurity.isFarmManager(#farmId)")
    @Operation(summary = "Phê duyệt chi phí vận hành", description = "Giám đốc trang trại phê duyệt chi phí từ DRAFT sang CONFIRMED và cập nhật giải ngân ngân sách")
    public ResponseEntity<FarmExpenseDetailResponse> confirmExpense(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(farmExpenseService.confirmExpense(farmId, id));
    }
}
