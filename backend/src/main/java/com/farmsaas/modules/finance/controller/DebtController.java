package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.finance.dto.DebtAgingReportDto;
import com.farmsaas.modules.finance.dto.DebtPaymentRequest;
import com.farmsaas.modules.finance.dto.DebtRecordRequest;
import com.farmsaas.modules.finance.dto.DebtRecordResponse;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import com.farmsaas.modules.finance.service.DebtService;
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
@RequestMapping({"/api/v1/farms/{farmId}/debts", "/api/v1/farms/{farmId}/finance/debts"})
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<DebtRecordResponse>>> searchDebts(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) String debtType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        DebtType parsedDebtType = null;
        if (debtType != null && !debtType.isBlank()) {
            if ("RECEIVABLE".equalsIgnoreCase(debtType)) {
                parsedDebtType = DebtType.PHAI_THU_KHACH;
            } else if ("PAYABLE".equalsIgnoreCase(debtType)) {
                parsedDebtType = DebtType.PHAI_TRA_NCC;
            } else {
                try {
                    parsedDebtType = DebtType.valueOf(debtType.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
        }

        DebtStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            if ("PAID".equalsIgnoreCase(status)) {
                parsedStatus = DebtStatus.DA_TAT_TOAN;
            } else if ("ACTIVE".equalsIgnoreCase(status)) {
                // ACTIVE nghĩa là chưa tất toán
                parsedStatus = null;
            } else {
                try {
                    parsedStatus = DebtStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<DebtRecordResponse> result = debtService.searchDebts(farmId, partnerId, parsedDebtType, parsedStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm công nợ thành công."));
    }

    @GetMapping("/aging-report")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<DebtAgingReportDto>> getAgingReport(@PathVariable Long farmId) {
        DebtAgingReportDto report = debtService.getAgingReport(farmId);
        return ResponseEntity.ok(ApiResponse.success(report, "Lấy báo cáo tuổi nợ thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<DebtRecordResponse>> getDebtById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        DebtRecordResponse response = debtService.getDebtById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết công nợ thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<DebtRecordResponse>> createDebt(
            @PathVariable Long farmId,
            @Valid @RequestBody DebtRecordRequest request
    ) {
        DebtRecordResponse response = debtService.createDebt(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhận công nợ thành công."));
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<DebtRecordResponse>> recordPayment(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody DebtPaymentRequest request
    ) {
        DebtRecordResponse response = debtService.recordPayment(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Ghi nhận thanh toán công nợ thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteDebt(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        debtService.deleteDebt(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa công nợ thành công."));
    }
}
