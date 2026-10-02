package com.farmsaas.modules.inventory.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.inventory.dto.WarehouseRequest;
import com.farmsaas.modules.inventory.dto.WarehouseResponse;
import com.farmsaas.modules.inventory.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getWarehousesByFarm(
            @PathVariable Long farmId
    ) {
        List<WarehouseResponse> response = warehouseService.getWarehousesByFarm(farmId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách kho hàng thành công."));
    }

    @GetMapping("/{warehouseId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getWarehouse(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId
    ) {
        WarehouseResponse response = warehouseService.getWarehouse(farmId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết kho hàng thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> createWarehouse(
            @PathVariable Long farmId,
            @Valid @RequestBody WarehouseRequest request
    ) {
        WarehouseResponse response = warehouseService.createWarehouse(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo kho hàng mới thành công."));
    }

    @PutMapping("/{warehouseId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> updateWarehouse(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId,
            @Valid @RequestBody WarehouseRequest request
    ) {
        WarehouseResponse response = warehouseService.updateWarehouse(farmId, warehouseId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật kho hàng thành công."));
    }

    @DeleteMapping("/{warehouseId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId
    ) {
        warehouseService.deleteWarehouse(farmId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa kho hàng thành công."));
    }
}
