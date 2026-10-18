package com.farm.saas.modules.inventory.controller;

import com.farm.saas.modules.inventory.dto.request.CancelWarehouseIssueRequest;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseIssueRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseIssueDetailResponse;
import com.farm.saas.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/farms/{farmId}/inventory/issues")
public class WarehouseIssueController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_ISSUE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseIssueDetailResponse> createIssue(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseIssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createIssue(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseIssueDetailResponse> getIssueById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getIssueById(farmId, id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_ISSUE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseIssueDetailResponse> completeIssue(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.completeIssue(farmId, id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_ISSUE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseIssueDetailResponse> cancelIssue(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody CancelWarehouseIssueRequest request) {
        return ResponseEntity.ok(inventoryService.cancelIssue(farmId, id, request));
    }
}
