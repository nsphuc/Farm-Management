package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.request.WarehouseCreateRequest;
import com.farm.saas.modules.inventory.dto.request.WarehouseUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseResponse;
import com.farm.saas.modules.inventory.entity.WarehouseStatus;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import com.farm.saas.modules.inventory.service.WarehouseService;
import com.farm.saas.security.scope.TheFarmBarrierGuard;
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

import java.util.List;

/**
 * Controller quản lý Kho bãi trong trang trại (Warehouses).
 * Thuộc Phân hệ Quản lý Kho & Vật tư (Nhóm 3 - 3.1 Quản lý kho).
 * Base URL: /api/v1/farms/{farmId}/warehouses
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/warehouses")
@RequiredArgsConstructor
@Tag(name = "Warehouse Management", description = "APIs CRUD quản lý Kho bãi và Vị trí lưu trữ trong Trang trại")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy danh sách kho bãi của trang trại có phân trang (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<Page<WarehouseResponse>>> getWarehousesByFarm(
            @PathVariable("farmId") Long farmId,
            @RequestParam(value = "warehouseType", required = false) WarehouseType warehouseType,
            @RequestParam(value = "status", required = false) WarehouseStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WarehouseResponse> page = warehouseService.getWarehousesByFarm(farmId, warehouseType, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kho bãi thành công", page));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy toàn bộ danh sách kho của trang trại (Dropdown)")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getDropdownWarehouses(@PathVariable("farmId") Long farmId) {
        List<WarehouseResponse> list = warehouseService.getDropdownWarehousesByFarm(farmId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kho bãi thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Xem chi tiết kho bãi theo ID và FarmId")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getWarehouseById(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        WarehouseResponse response = warehouseService.getWarehouseById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin kho bãi thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Tạo mới kho bãi trong trang trại (Yêu cầu vai trò quản lý / Chủ trang trại)")
    public ResponseEntity<ApiResponse<WarehouseResponse>> createWarehouse(
            @PathVariable("farmId") Long farmId,
            @Valid @RequestBody WarehouseCreateRequest request) {
        WarehouseResponse created = warehouseService.createWarehouse(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới kho bãi thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Cập nhật thông tin kho bãi (Yêu cầu vai trò quản lý)")
    public ResponseEntity<ApiResponse<WarehouseResponse>> updateWarehouse(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id,
            @Valid @RequestBody WarehouseUpdateRequest request) {
        WarehouseResponse updated = warehouseService.updateWarehouse(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin kho bãi thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Vô hiệu hóa kho bãi (Soft-delete: status=INACTIVE)")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        warehouseService.deactivateWarehouse(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa kho bãi thành công", null));
    }
}
