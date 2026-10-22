package com.farm.saas.modules.inventory.controller;

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
@RequestMapping("/api/v1/farms/{farmId}/inventory/transfers")
public class WarehouseTransferController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<org.springframework.data.domain.Page<WarehouseTransferDetailResponse>> getTransfers(
            @PathVariable Long farmId,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getTransfers(farmId, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_TRANSFER') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> createTransfer(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseTransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createTransfer(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> getTransferById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getTransferById(farmId, id));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_TRANSFER') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> dispatchTransfer(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.dispatchTransfer(farmId, id));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_TRANSFER') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseTransferDetailResponse> receiveTransfer(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.receiveTransfer(farmId, id));
    }
}
