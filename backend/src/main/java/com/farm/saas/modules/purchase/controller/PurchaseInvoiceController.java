package com.farm.saas.modules.purchase.controller;

import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.modules.purchase.dto.request.CreatePurchaseInvoiceRequest;
import com.farm.saas.modules.purchase.dto.request.PayDebtRequest;
import com.farm.saas.modules.purchase.dto.response.PurchaseInvoiceDetailResponse;
import com.farm.saas.modules.purchase.service.PurchaseInvoiceService;
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
@RequestMapping({"/api/v1/purchase-invoices", "/api/v1/farms/{farmId}/purchase-invoices"})
@RequiredArgsConstructor
@Tag(name = "Purchase Invoices", description = "Quản lý hóa đơn nhập hàng (Cám, Thuốc, Con giống) và Công nợ NCC")
public class PurchaseInvoiceController {

    private final PurchaseInvoiceService purchaseInvoiceService;
    private final FarmSecurityEvaluator farmSecurity;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('purchase_invoices.view', 'purchase_invoices.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Lấy danh sách hóa đơn nhập hàng có phân trang và lọc theo chi nhánh/nhà cung cấp")
    public ResponseEntity<Page<PurchaseInvoiceDetailResponse>> getInvoices(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String invoiceType,
            @RequestParam(required = false) String paymentStatus,
            @PageableDefault(sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : filterFarmId;
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, branchId);
        return ResponseEntity.ok(purchaseInvoiceService.getInvoices(targetFarmId, effectiveBranchId, supplierId, invoiceType, paymentStatus, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('purchase_invoices.view', 'purchase_invoices.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Xem chi tiết một hóa đơn nhập hàng")
    public ResponseEntity<PurchaseInvoiceDetailResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseInvoiceService.getInvoiceById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('purchase_invoices.create', 'purchase_invoices.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Tạo hóa đơn nhập hàng mới (tự động cộng kho FEFO hoặc tăng đàn, sinh Phiếu Chi và Công nợ)")
    public ResponseEntity<PurchaseInvoiceDetailResponse> createInvoice(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long queryFarmId,
            @Valid @RequestBody CreatePurchaseInvoiceRequest request) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : (queryFarmId != null ? queryFarmId : 1L);
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseInvoiceService.createInvoice(targetFarmId, request));
    }

    @PostMapping("/{id}/pay-debt")
    @PreAuthorize("hasAnyAuthority('purchase_invoices.create', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Thanh toán công nợ cho nhà cung cấp theo hóa đơn nhập hàng")
    public ResponseEntity<PurchaseInvoiceDetailResponse> payDebt(
            @PathVariable Long id,
            @Valid @RequestBody PayDebtRequest request) {
        return ResponseEntity.ok(purchaseInvoiceService.payDebt(id, request));
    }
}
