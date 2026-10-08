package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.finance.dto.SalesOrderRequest;
import com.farmsaas.modules.finance.dto.SalesOrderResponse;
import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
import com.farmsaas.modules.finance.service.SalesOrderService;
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
@RequestMapping({"/api/v1/farms/{farmId}/sales-orders", "/api/v1/farms/{farmId}/finance/sales-orders"})
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<SalesOrderResponse>>> searchOrders(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) DeliveryStatus deliveryStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SalesOrderResponse> result = salesOrderService.searchOrders(farmId, partnerId, paymentStatus, deliveryStatus, fromDate, toDate, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm đơn hàng xuất bán thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> getOrderById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        SalesOrderResponse response = salesOrderService.getOrderById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết đơn hàng thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createOrder(
            @PathVariable Long farmId,
            @Valid @RequestBody SalesOrderRequest request
    ) {
        SalesOrderResponse response = salesOrderService.createOrder(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo đơn hàng xuất bán thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> updateOrder(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody SalesOrderRequest request
    ) {
        SalesOrderResponse response = salesOrderService.updateOrder(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật đơn hàng thành công."));
    }

    @PatchMapping("/{id}/delivery")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> updateDeliveryStatus(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @RequestParam DeliveryStatus status
    ) {
        SalesOrderResponse response = salesOrderService.updateDeliveryStatus(farmId, id, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái giao hàng thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        salesOrderService.deleteOrder(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa đơn hàng thành công."));
    }
}
