package com.farm.saas.modules.inventory.controller;

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
@RequestMapping("/api/v1/farms/{farmId}/inventory/stocktakes")
public class StocktakeController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_STOCKTAKE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> createStocktake(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateStocktakeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createStocktake(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> getStocktakeById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getStocktakeById(farmId, id));
    }

    @PostMapping("/{id}/count")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_STOCKTAKE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> recordStocktakeCount(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecordStocktakeCountRequest request) {
        return ResponseEntity.ok(inventoryService.recordStocktakeCount(farmId, id, request));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_STOCKTAKE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<StocktakeDetailResponse> adjustStocktake(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.adjustStocktake(farmId, id));
    }
}
