package com.farm.saas.modules.inventory.controller;

import com.farm.saas.modules.inventory.dto.request.CancelWarehouseReceiptRequest;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseReceiptRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseReceiptDetailResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/v1/farms/{farmId}/inventory/receipts", "/api/v1/inventory/receipts"})
public class WarehouseReceiptController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<Page<WarehouseReceiptDetailResponse>> getReceipts(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getReceipts(farmId, warehouseId, partnerId, status, fromDate, toDate, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseReceiptDetailResponse> createReceipt(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseReceiptRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createReceipt(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<WarehouseReceiptDetailResponse> getReceiptById(
            @PathVariable(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getReceiptById(farmId, id));
    }

    @PostMapping({"/{id}/complete", "/{id}/approve"})
    @PreAuthorize("hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.isFarmManager(#farmId)")
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
