package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.modules.inventory.dto.request.CreateStocktakeRequest;
import com.farm.saas.modules.inventory.dto.request.RecordStocktakeCountRequest;
import com.farm.saas.modules.inventory.dto.response.StocktakeDetailResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/v1/farms/{farmId}/inventory/stocktakes", "/api/v1/inventory/stocktakes"})
public class StocktakeController {

    private final InventoryService inventoryService;
    private final FarmSecurityEvaluator farmSecurity;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'inventory.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT', 'ROLE_TECHNICAL_STAFF')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<org.springframework.data.domain.Page<StocktakeDetailResponse>> getStocktakes(
            @PathVariable(required = false) Long farmId,
            @RequestParam(name = "farmId", required = false) Long paramFarmId,
            @RequestParam(required = false) Long branchId,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : paramFarmId;
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, branchId);
        return ResponseEntity.ok(inventoryService.getStocktakes(targetFarmId, effectiveBranchId, pageable));
    }

    @PostMapping
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_STOCKTAKE', 'inventory.manage', 'transfers.create') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> createStocktake(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateStocktakeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createStocktake(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'inventory.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<StocktakeDetailResponse> getStocktakeById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getStocktakeById(farmId, id));
    }

    @PostMapping({"/{id}/count", "/{id}/record-count"})
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_STOCKTAKE', 'inventory.manage', 'transfers.create') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> recordStocktakeCount(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecordStocktakeCountRequest request) {
        return ResponseEntity.ok(inventoryService.recordStocktakeCount(farmId, id, request));
    }

    @PostMapping({"/{id}/adjust", "/{id}/approve"})
    @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_STOCKTAKE', 'inventory.manage', 'transfers.approve') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> adjustStocktake(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.adjustStocktake(farmId, id));
    }
}
