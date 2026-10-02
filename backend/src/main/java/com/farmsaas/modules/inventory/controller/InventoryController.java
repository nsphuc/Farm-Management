package com.farmsaas.modules.inventory.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import com.farmsaas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // --- TỒN KHO & CẢNH BÁO ---

    @GetMapping("/farms/{farmId}/inventory/stocks")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getInventoryStocks(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long warehouseId
    ) {
        List<InventoryStockResponse> response = inventoryService.getInventory(farmId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách tồn kho thành công."));
    }

    @GetMapping("/farms/{farmId}/inventory/warehouses/{warehouseId}/stocks")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getInventoryByWarehouse(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId
    ) {
        List<InventoryStockResponse> response = inventoryService.getInventoryByWarehouse(farmId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin tồn kho thành công."));
    }

    @GetMapping("/inventory/expiring-batches")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getExpiringBatches(
            @RequestParam(defaultValue = "30") Integer days
    ) {
        List<InventoryStockResponse> response = inventoryService.getExpiringBatches(days);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách vật tư cận hạn thành công."));
    }

    // --- PHIẾU NHẬP KHO (RECEIPTS) ---

    @PostMapping("/farms/{farmId}/inventory/receipts")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseReceiptResponse>> createReceipt(
            @PathVariable Long farmId,
            @Valid @RequestBody WarehouseReceiptRequest request
    ) {
        WarehouseReceiptResponse response = inventoryService.createReceipt(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lập phiếu nhập kho thành công."));
    }

    @GetMapping("/farms/{farmId}/inventory/receipts")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseReceiptResponse>>> searchReceipts(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("receiptDate").descending());
        Page<WarehouseReceiptResponse> result = inventoryService.searchReceipts(farmId, warehouseId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy danh sách phiếu nhập kho thành công."));
    }

    // --- PHIẾU XUẤT KHO (ISSUES) ---

    @PostMapping("/farms/{farmId}/inventory/issues")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseIssueResponse>> createIssue(
            @PathVariable Long farmId,
            @Valid @RequestBody WarehouseIssueRequest request
    ) {
        WarehouseIssueResponse response = inventoryService.createIssue(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lập phiếu xuất kho thành công."));
    }

    @GetMapping("/farms/{farmId}/inventory/issues")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseIssueResponse>>> searchIssues(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String issueType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("issueDate").descending());
        Page<WarehouseIssueResponse> result = inventoryService.searchIssues(farmId, warehouseId, issueType, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy danh sách phiếu xuất kho thành công."));
    }

    // --- KIỂM KÊ KHO (STOCKTAKES) ---

    @PostMapping("/farms/{farmId}/inventory/stocktakes")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<StocktakeResponse>> createStocktake(
            @PathVariable Long farmId,
            @Valid @RequestBody StocktakeRequest request
    ) {
        StocktakeResponse response = inventoryService.createStocktake(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lập phiếu kiểm kê kho thành công."));
    }

    @PutMapping("/farms/{farmId}/inventory/stocktakes/{stocktakeId}/reconcile")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<StocktakeResponse>> reconcileStocktake(
            @PathVariable Long farmId,
            @PathVariable Long stocktakeId
    ) {
        StocktakeResponse response = inventoryService.reconcileStocktake(farmId, stocktakeId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cân bằng kho sau kiểm kê thành công."));
    }

    @GetMapping("/farms/{farmId}/inventory/stocktakes")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<StocktakeResponse>>> searchStocktakes(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) StocktakeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("stocktakeDate").descending());
        Page<StocktakeResponse> result = inventoryService.searchStocktakes(farmId, warehouseId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy danh sách kiểm kê kho thành công."));
    }

    // --- ĐIỀU CHUYỂN KHO LIÊN TRANG TRẠI (INTER-FARM TRANSFERS) ---

    @PostMapping("/inventory/transfers")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseTransferResponse>> createTransfer(
            @Valid @RequestBody WarehouseTransferRequest request
    ) {
        WarehouseTransferResponse response = inventoryService.createTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lập phiếu điều chuyển kho thành công."));
    }

    @PutMapping("/inventory/transfers/{transferId}/dispatch")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseTransferResponse>> dispatchTransfer(
            @PathVariable Long transferId
    ) {
        WarehouseTransferResponse response = inventoryService.dispatchTransfer(transferId);
        return ResponseEntity.ok(ApiResponse.success(response, "Xuất kho điều chuyển thành công (hàng đang chuyển)."));
    }

    @PutMapping("/inventory/transfers/{transferId}/receive")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseTransferResponse>> receiveTransfer(
            @PathVariable Long transferId
    ) {
        WarehouseTransferResponse response = inventoryService.receiveTransfer(transferId);
        return ResponseEntity.ok(ApiResponse.success(response, "Nhập kho điều chuyển thành công."));
    }

    @PutMapping("/inventory/transfers/{transferId}/cancel")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseTransferResponse>> cancelTransfer(
            @PathVariable Long transferId
    ) {
        WarehouseTransferResponse response = inventoryService.cancelTransfer(transferId);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy phiếu điều chuyển kho thành công."));
    }

    @GetMapping("/inventory/transfers")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseTransferResponse>>> searchTransfers(
            @RequestParam(required = false) Long fromWarehouseId,
            @RequestParam(required = false) Long toWarehouseId,
            @RequestParam(required = false) TransferStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transferDate").descending());
        Page<WarehouseTransferResponse> result = inventoryService.searchTransfers(fromWarehouseId, toWarehouseId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy danh sách điều chuyển kho thành công."));
    }
}
