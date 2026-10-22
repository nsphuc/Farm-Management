package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.RecallProductBatchRequest;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import com.farm.saas.modules.quality.service.ProductBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/product-batches")
@RequiredArgsConstructor
public class ProductBatchTenantController {

    private final ProductBatchService productBatchService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_FARM_VIEW')")
    public ResponseEntity<Page<ProductBatchDetailResponse>> getAllProductBatches(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(productBatchService.getProductBatches(farmId, status, keyword, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_FARM_VIEW')")
    public ResponseEntity<ProductBatchDetailResponse> getProductBatchById(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(productBatchService.getProductBatchById(farmId, id));
    }

    @PostMapping("/{id}/recall")
    @PreAuthorize("hasAuthority('PERM_QC_RECALL')")
    public ResponseEntity<ProductBatchDetailResponse> recallBatch(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecallProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.recallBatch(farmId, id, request));
    }
}
