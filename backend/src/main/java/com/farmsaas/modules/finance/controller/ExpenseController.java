package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.finance.dto.ExpenseRequest;
import com.farmsaas.modules.finance.dto.ExpenseResponse;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import com.farmsaas.modules.finance.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/expenses", "/api/v1/farms/{farmId}/finance/expenses"})
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<ExpenseResponse>>> searchExpenses(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) Long herdId,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ExpenseResponse> result = expenseService.searchExpenses(farmId, categoryId, seasonId, herdId, paymentMethod, fromDate, toDate, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm chi phí thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpenseById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        ExpenseResponse response = expenseService.getExpenseById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết chi phí thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            @PathVariable Long farmId,
            @Valid @RequestBody ExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.createExpense(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhận chi phí trang trại thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.updateExpense(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật chi phí thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        expenseService.deleteExpense(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa khoản chi phí thành công."));
    }
}
