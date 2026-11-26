package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseTransferRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseTransferDetailResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/v1/transfers", "/api/v1/farms/{farmId}/inventory/transfers", "/api/v1/inventory/transfers"})
public class WarehouseTransferController {

    private final InventoryService inventoryService;
    private final FarmSecurityEvaluator farmSecurity;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'inventory.view', 'transfers.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<org.springframework.data.domain.Page<WarehouseTransferDetailResponse>> getTransfers(
            @PathVariable(required = false) Long farmId,
            @RequestParam(name = "farmId", required = false) Long paramFarmId,
            @RequestParam(required = false) Long branchId,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : paramFarmId;
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, branchId);
        return ResponseEntity.ok(inventoryService.getTransfers(targetFarmId, effectiveBranchId, pageable));
    }

    @PostMapping
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_TRANSFER', 'transfers.create', 'inventory.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> createTransfer(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseTransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createTransfer(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'inventory.view', 'transfers.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<WarehouseTransferDetailResponse> getTransferById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getTransferById(farmId, id));
    }

    @PostMapping({"/{id}/dispatch", "/{id}/approve"})
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_TRANSFER', 'transfers.approve', 'inventory.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> dispatchTransfer(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.dispatchTransfer(farmId, id));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_TRANSFER', 'transfers.update', 'inventory.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> receiveTransfer(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.receiveTransfer(farmId, id));
    }
}
