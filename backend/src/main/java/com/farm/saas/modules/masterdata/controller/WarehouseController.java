package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.response.WarehouseResponse;
import com.farm.saas.modules.masterdata.service.WarehouseService;
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
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<WarehouseResponse>> getWarehouses(
            @PathVariable Long farmId,
            @RequestParam(required = false) String warehouseType) {
        return ResponseEntity.ok(warehouseService.getWarehouses(farmId, warehouseType));
    }

    @GetMapping("/{warehouseId}")
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseResponse> getWarehouseById(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(farmId, warehouseId));
    }

    @PostMapping
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_RECEIPT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseResponse> createWarehouse(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.createWarehouse(farmId, request));
    }

    @PutMapping("/{warehouseId}")
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_RECEIPT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseResponse> updateWarehouse(
            @PathVariable Long farmId,
            @PathVariable Long warehouseId,
            @Valid @RequestBody UpdateWarehouseRequest request) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(farmId, warehouseId, request));
    }
}
