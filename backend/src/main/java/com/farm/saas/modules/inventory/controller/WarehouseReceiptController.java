package com.farm.saas.modules.inventory.controller;

import com.farm.saas.modules.inventory.dto.request.CancelWarehouseReceiptRequest;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseReceiptRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseReceiptDetailResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/farms/{farmId}/inventory/receipts")
public class WarehouseReceiptController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseReceiptDetailResponse> createReceipt(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseReceiptRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createReceipt(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseReceiptDetailResponse> getReceiptById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getReceiptById(farmId, id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseReceiptDetailResponse> completeReceipt(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.completeReceipt(farmId, id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseReceiptDetailResponse> cancelReceipt(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody CancelWarehouseReceiptRequest request) {
        return ResponseEntity.ok(inventoryService.cancelReceipt(farmId, id, request));
    }
}
