package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.CreateSalesDeliveryRequest;
import com.farm.saas.modules.finance.dto.request.UpdateDeliveryPodRequest;
import com.farm.saas.modules.finance.dto.response.SalesDeliveryDetailResponse;
import com.farm.saas.modules.finance.service.SalesDeliveryService;
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
@RequestMapping("/api/v1/farms/{farmId}/sales-deliveries")
@RequiredArgsConstructor
@Tag(name = "Sales Deliveries", description = "Xuất giao hàng nhiều đợt, ghi sổ cái bất biến và sinh công nợ phải thu")
public class SalesDeliveryController {

    private final SalesDeliveryService salesDeliveryService;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_DELIVERY_MANAGE', 'PERM_FINANCE_REPORT', 'PERM_FINANCE_SALES_ORDER') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách đợt giao hàng", description = "Lấy danh sách các đợt giao hàng có phân trang")
    public ResponseEntity<Page<SalesDeliveryDetailResponse>> getDeliveries(
            @PathVariable Long farmId,
            @PageableDefault(sort = "deliveryDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(salesDeliveryService.getDeliveries(farmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_DELIVERY_MANAGE', 'PERM_FINANCE_REPORT', 'PERM_FINANCE_SALES_ORDER') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết đợt giao hàng", description = "Xem chi tiết một đợt xuất giao và mặt hàng đính kèm")
    public ResponseEntity<SalesDeliveryDetailResponse> getDeliveryById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(salesDeliveryService.getDeliveryById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_DELIVERY_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo đợt xuất giao hàng (Atomic Delivery Flow 6)",
            description = "Trừ tồn kho thành phẩm, giải phóng giữ chỗ, ghi sổ cái product_batch_transactions và sinh công nợ phải thu")
    public ResponseEntity<SalesDeliveryDetailResponse> createDelivery(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateSalesDeliveryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesDeliveryService.createDelivery(farmId, request));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAuthority('PERM_DELIVERY_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Xác nhận điều xe / xuất bến", description = "Cập nhật trạng thái điều phối xuất bến của chuyến hàng")
    public ResponseEntity<SalesDeliveryDetailResponse> dispatchDelivery(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(salesDeliveryService.dispatchDelivery(farmId, id));
    }

    @PostMapping("/{id}/pod")
    @PreAuthorize("hasAuthority('PERM_DELIVERY_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật biên bản giao nhận POD", description = "Đính kèm ảnh chứng từ Proof-of-Delivery và hoàn tất giao hàng")
    public ResponseEntity<SalesDeliveryDetailResponse> updatePod(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeliveryPodRequest request) {
        return ResponseEntity.ok(salesDeliveryService.updatePod(farmId, id, request));
    }
}
