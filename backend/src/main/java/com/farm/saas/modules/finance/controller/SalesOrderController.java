package com.farm.saas.modules.finance.controller;

import com.farm.saas.modules.finance.dto.request.CreateSalesOrderRequest;
import com.farm.saas.modules.finance.dto.response.SalesOrderDetailResponse;
import com.farm.saas.modules.finance.service.SalesOrderService;
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
@RequestMapping({"/api/v1/farms/{farmId}/sales-orders", "/api/v1/sales-orders"})
@RequiredArgsConstructor
@Tag(name = "Sales Orders", description = "Đơn hàng bán sỉ, giữ chỗ tồn kho lô và thanh toán VietQR Napas247")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_REPORT', 'PERM_FINANCE_PAYMENT', 'PERM_DELIVERY_MANAGE', 'PERM_INVENTORY_ISSUE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT', 'ROLE_WAREHOUSE_STAFF')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách đơn bán sỉ", description = "Lấy danh sách các đơn đặt hàng bán sỉ có phân trang")
    public ResponseEntity<Page<SalesOrderDetailResponse>> getOrders(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @PageableDefault(sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : filterFarmId;
        return ResponseEntity.ok(salesOrderService.getOrders(targetFarmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_REPORT', 'PERM_FINANCE_PAYMENT', 'PERM_DELIVERY_MANAGE', 'PERM_INVENTORY_ISSUE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT', 'ROLE_WAREHOUSE_STAFF')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Chi tiết đơn bán sỉ & VietQR", description = "Lấy thông tin chi tiết đơn hàng, mặt hàng và URL VietQR thanh toán")
    public ResponseEntity<SalesOrderDetailResponse> getOrderById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getOrderById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo mới đơn hàng bán sỉ",
            description = "Tạo đơn hàng mới, kiểm tra hạn mức tín dụng khách hàng và tính toán thuế, chiết khấu, công nợ")
    public ResponseEntity<SalesOrderDetailResponse> createOrder(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateSalesOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.createOrder(farmId, request));
    }

    @PostMapping({"/{id}/confirm", "/{id}/approve"})
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') and @farmSecurity.isFarmManager(#farmId)")
    @Operation(summary = "Duyệt đơn hàng bán sỉ & Giữ chỗ tồn kho",
            description = "Phê duyệt đơn hàng và khóa bi quan để tăng reserved_quantity của các lô thành phẩm chỉ định")
    public ResponseEntity<SalesOrderDetailResponse> confirmOrder(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.confirmOrder(farmId, id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Hủy đơn hàng bán sỉ & Hoàn trả giữ chỗ",
            description = "Hủy đơn hàng khi chưa có đợt giao hoàn tất và giải phóng lượng hàng đã giữ chỗ")
    public ResponseEntity<SalesOrderDetailResponse> cancelOrder(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.cancelOrder(farmId, id));
    }
}
