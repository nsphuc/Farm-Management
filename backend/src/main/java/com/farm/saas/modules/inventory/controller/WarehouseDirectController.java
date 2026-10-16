package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.response.WarehouseResponse;
import com.farm.saas.modules.inventory.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tra cứu Kho bãi trực tiếp theo Tenant (Direct Lookup).
 * Base URL: /api/v1/warehouses
 */
@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
@Tag(name = "Warehouse Management (Direct)", description = "APIs tra cứu Kho bãi trên toàn bộ Tenant")
public class WarehouseDirectController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Lấy danh sách tất cả các kho thuộc toàn bộ Tenant (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<Page<WarehouseResponse>>> getAllWarehouses(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WarehouseResponse> page = warehouseService.getAllWarehousesInTenant(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách kho bãi thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Xem chi tiết kho bãi theo ID trực tiếp")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getWarehouseByIdDirect(@PathVariable("id") Long id) {
        WarehouseResponse response = warehouseService.getWarehouseByIdDirect(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin kho bãi thành công", response));
    }
}
