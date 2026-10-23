package com.farm.saas.modules.inventory.controller;

import com.farm.saas.modules.inventory.dto.response.InventoryItemResponse;
import com.farm.saas.modules.inventory.dto.response.InventorySummaryResponse;
import com.farm.saas.modules.inventory.dto.response.InventoryTransactionResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
public class InventoryQueryController {

    private final InventoryService inventoryService;

    @GetMapping({"/api/v1/farms/{farmId}/inventory/summary", "/api/v1/inventory/summary"})
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long warehouseId) {
        return ResponseEntity.ok(inventoryService.getInventorySummary(farmId, warehouseId));
    }

    @GetMapping({"/api/v1/farms/{farmId}/inventory", "/api/v1/inventory"})
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<Page<InventoryItemResponse>> getInventory(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long materialId,
            @RequestParam(required = false) String batchNumber,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean nearExpiry,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getInventory(
                farmId, warehouseId, materialId, batchNumber, lowStock, nearExpiry, pageable));
    }

    @GetMapping({"/api/v1/farms/{farmId}/inventory/transactions", "/api/v1/inventory/transactions"})
    @PreAuthorize("(hasAuthority('PERM_INVENTORY_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    public ResponseEntity<Page<InventoryTransactionResponse>> getTransactions(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long materialId,
            @RequestParam(required = false) String batchNumber,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getTransactions(
                farmId, warehouseId, materialId, batchNumber, transactionType, fromDate, toDate, pageable));
    }
}
