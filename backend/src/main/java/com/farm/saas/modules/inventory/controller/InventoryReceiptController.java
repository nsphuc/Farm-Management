package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.request.InventoryReceiptCreateRequest;
import com.farm.saas.modules.inventory.dto.response.InventoryReceiptResponse;
import com.farm.saas.modules.inventory.service.InventoryReceiptService;
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

import java.util.Map;

/**
 * Controller xử lý các yêu cầu Giao dịch Nhập kho (Nghiệp vụ: 3.3. Nhập kho - Inventory Receipts).
 * Base URL: /api/v1/inventory/receipts
 */
@RestController
@RequestMapping("/api/v1/inventory/receipts")
@RequiredArgsConstructor
@Tag(name = "Inventory Receipts", description = "APIs quản lý chứng từ Nhập kho và cập nhật thẻ kho (3.3 Nhập kho)")
public class InventoryReceiptController {

    private final InventoryReceiptService receiptService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_RECEIPT')")
    @Operation(summary = "Tạo mới Phiếu Nhập kho (Yêu cầu PERM_INVENTORY_MANAGE hoặc PERM_INVENTORY_RECEIPT)")
    public ResponseEntity<ApiResponse<InventoryReceiptResponse>> createReceipt(
            @Valid @RequestBody InventoryReceiptCreateRequest request) {
        InventoryReceiptResponse response = receiptService.createReceipt(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu nhập kho thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Lấy danh sách phiếu nhập kho có phân trang (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<Page<InventoryReceiptResponse>>> getReceipts(
            @RequestParam(value = "farmId", required = false) Long farmId,
            @RequestParam(value = "warehouseId", required = false) Long warehouseId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InventoryReceiptResponse> page = receiptService.getReceipts(farmId, warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu nhập kho thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Xem chi tiết Phiếu Nhập kho theo ID (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<InventoryReceiptResponse>> getReceiptById(@PathVariable("id") Long id) {
        InventoryReceiptResponse response = receiptService.getReceiptById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phiếu nhập kho thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_RECEIPT')")
    @Operation(summary = "Hủy Phiếu Nhập kho (Hoàn trừ tồn kho an toàn)")
    public ResponseEntity<ApiResponse<Void>> cancelReceipt(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Hủy theo yêu cầu của người dùng";
        receiptService.cancelReceipt(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu nhập kho thành công", null));
    }
}
