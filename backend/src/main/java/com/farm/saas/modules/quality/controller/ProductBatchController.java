package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import com.farm.saas.modules.quality.service.ProductBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/product-batches")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService productBatchService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_HARVEST_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> createProductBatch(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateProductBatchRequest request) {
        ProductBatchDetailResponse response = productBatchService.createProductBatch(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<ProductBatchDetailResponse>> getProductBatches(
            @PathVariable Long farmId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productBatchService.getProductBatches(farmId, status, keyword, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> getProductBatchById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(productBatchService.getProductBatchById(farmId, id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_QC_APPROVE') and @farmSecurity.canApproveBatch(#farmId, #id)")
    public ResponseEntity<ProductBatchDetailResponse> approveBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApproveProductBatchRequest request) {
        if (request == null) {
            request = new ApproveProductBatchRequest();
        }
        return ResponseEntity.ok(productBatchService.approveBatch(farmId, id, request));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_QC_APPROVE') and @farmSecurity.canApproveBatch(#farmId, #id)")
    public ResponseEntity<ProductBatchDetailResponse> rejectBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RejectProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.rejectBatch(farmId, id, request));
    }

    @PostMapping("/{id}/recall")
    @PreAuthorize("hasAuthority('PERM_QC_RECALL') and @farmSecurity.isFarmManagerOrOwner(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> recallBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecallProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.recallBatch(farmId, id, request));
    }

    @PostMapping("/{id}/print-label")
    @PreAuthorize("hasAuthority('PERM_LABEL_PRINT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> printLabel(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody PrintLabelRequest request) {
        return ResponseEntity.ok(productBatchService.printLabel(farmId, id, request));
    }
}
