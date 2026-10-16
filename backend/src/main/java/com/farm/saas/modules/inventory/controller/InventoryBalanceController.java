package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.response.InventoryBalanceResponse;
import com.farm.saas.modules.inventory.service.InventoryBalanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý theo dõi số dư tồn kho (Nghiệp vụ: 3.7. Theo dõi tồn kho hiện tại - Inventory Balance).
 * Base URL: /api/v1/inventory/balances
 */
@RestController
@RequestMapping("/api/v1/inventory/balances")
@RequiredArgsConstructor
@Tag(name = "Inventory Balances", description = "APIs theo dõi số lượng tồn kho thực tế, giữ chỗ và khả dụng (3.7 Tồn kho hiện tại)")
public class InventoryBalanceController {

    private final InventoryBalanceService balanceService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Lấy danh sách tồn kho có phân trang (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<Page<InventoryBalanceResponse>>> getBalances(
            @RequestParam(value = "farmId", required = false) Long farmId,
            @RequestParam(value = "warehouseId", required = false) Long warehouseId,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InventoryBalanceResponse> page = balanceService.getBalances(farmId, warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tồn kho thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Xem chi tiết số dư tồn kho theo ID (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<InventoryBalanceResponse>> getBalanceById(@PathVariable("id") Long id) {
        InventoryBalanceResponse response = balanceService.getBalanceById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tồn kho thành công", response));
    }

    @GetMapping("/batches")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Lấy danh sách các lô còn hàng của vật tư trong kho (Hỗ trợ gợi ý FIFO/FEFO khi xuất kho)")
    public ResponseEntity<ApiResponse<List<InventoryBalanceResponse>>> getAvailableBatches(
            @RequestParam("warehouseId") Long warehouseId,
            @RequestParam("materialId") Long materialId,
            @RequestParam(value = "strategy", defaultValue = "FIFO") String strategy) {
        List<InventoryBalanceResponse> list = balanceService.getAvailableBatches(warehouseId, materialId, strategy);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lô hàng thành công", list));
    }
}
