package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.AllocatePaymentRequest;
import com.farm.saas.modules.finance.dto.request.CreatePaymentTransactionRequest;
import com.farm.saas.modules.finance.dto.request.DebtOffsetRequest;
import com.farm.saas.modules.finance.dto.response.DebtRecordDetailResponse;
import com.farm.saas.modules.finance.dto.response.PaymentAllocationResponse;
import com.farm.saas.modules.finance.dto.response.PaymentTransactionDetailResponse;
import com.farm.saas.modules.finance.service.DebtAndPaymentService;
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
@RequestMapping({"/api/v1/farms/{farmId}", "/api/v1/finance"})
@RequiredArgsConstructor
@Tag(name = "Debt and Payment", description = "Sổ cái công nợ 2 chiều, thanh toán VietQR và cấn trừ nợ DEBT_OFFSET")
public class DebtAndPaymentController {

    private final DebtAndPaymentService debtAndPaymentService;

    @GetMapping("/debts")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_PAYMENT', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách công nợ", description = "Truy vấn sổ công nợ có lọc theo đối tác, loại nợ (RECEIVABLE/PAYABLE) và trạng thái")
    public ResponseEntity<Page<DebtRecordDetailResponse>> getDebts(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) String debtType,
            @RequestParam(required = false) String status,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : filterFarmId;
        return ResponseEntity.ok(debtAndPaymentService.getDebts(targetFarmId, partnerId, debtType, status, pageable));
    }

    @GetMapping("/debts/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_PAYMENT', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Chi tiết khoản nợ", description = "Xem chi tiết một khoản công nợ phải thu hoặc phải trả")
    public ResponseEntity<DebtRecordDetailResponse> getDebtById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(debtAndPaymentService.getDebtById(farmId, id));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAuthority('PERM_FINANCE_PAYMENT') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo giao dịch thanh toán",
            description = "Ghi nhận giao dịch thu/chi/hoàn tiền qua các phương thức CASH, BANK_TRANSFER, VIETQR, DEBT_OFFSET")
    public ResponseEntity<PaymentTransactionDetailResponse> createPayment(
            @PathVariable Long farmId,
            @Valid @RequestBody CreatePaymentTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(debtAndPaymentService.createPayment(farmId, request));
    }

    @PostMapping({"/payments/{id}/confirm", "/payments/{id}/approve"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_PAYMENT') and @farmSecurity.isFarmManager(#farmId)")
    @Operation(summary = "Xác nhận duyệt giao dịch thanh toán",
            description = "Giám đốc trang trại duyệt phiếu chi/thu tiền, cập nhật trạng thái COMPLETED và phân bổ trừ nợ")
    public ResponseEntity<PaymentTransactionDetailResponse> confirmPayment(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(debtAndPaymentService.confirmPayment(farmId, id));
    }

    @PostMapping("/payments/{id}/allocate")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_ALLOCATE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Phân bổ thanh toán vào công nợ (Flow 7)",
            description = "Khóa bi quan khoản nợ, trừ dư nợ còn lại, ghi sổ bất biến payment_allocations và đồng bộ đơn hàng")
    public ResponseEntity<PaymentAllocationResponse> allocatePayment(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody AllocatePaymentRequest request) {
        return ResponseEntity.ok(debtAndPaymentService.allocatePayment(farmId, id, request));
    }

    @PostMapping("/debts/offset")
    @PreAuthorize("hasAuthority('PERM_PAYMENT_ALLOCATE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cấn trừ công nợ 2 chiều (DEBT_OFFSET)",
            description = "Cấn trừ đồng thời giữa khoản nợ phải thu và khoản nợ phải trả của cùng một đối tác theo cơ chế an toàn Deadlock")
    public ResponseEntity<PaymentTransactionDetailResponse> offsetDebts(
            @PathVariable Long farmId,
            @Valid @RequestBody DebtOffsetRequest request) {
        return ResponseEntity.ok(debtAndPaymentService.offsetDebts(farmId, request));
    }
}
