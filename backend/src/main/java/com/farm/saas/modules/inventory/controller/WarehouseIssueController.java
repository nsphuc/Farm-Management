package com.farm.saas.modules.inventory.controller;

import com.farm.saas.modules.inventory.dto.request.CancelWarehouseIssueRequest;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseIssueRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseIssueDetailResponse;
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
@RequestMapping({"/api/v1/farms/{farmId}/inventory/issues", "/api/v1/inventory/issues"})
public class WarehouseIssueController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    public ResponseEntity<Page<WarehouseIssueDetailResponse>> getIssues(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getIssues(farmId, warehouseId, status, fromDate, toDate, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_ISSUE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<WarehouseIssueDetailResponse> createIssue(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateWarehouseIssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createIssue(farmId, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    public ResponseEntity<WarehouseIssueDetailResponse> getIssueById(
            @PathVariable(required = false) Long farmId,
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
