package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateConsumptionQuotaRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateConsumptionQuotaRequest;
import com.farm.saas.modules.masterdata.dto.response.ConsumptionQuotaResponse;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quotas")
@RequiredArgsConstructor
public class ConsumptionQuotaController {

    private final MasterCatalogService masterCatalogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CROP_VIEW')")
    public ResponseEntity<List<ConsumptionQuotaResponse>> getQuotas(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(masterCatalogService.getQuotas(farmId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN')")
    public ResponseEntity<ConsumptionQuotaResponse> createQuota(@Valid @RequestBody CreateConsumptionQuotaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterCatalogService.createQuota(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN')")
    public ResponseEntity<ConsumptionQuotaResponse> updateQuota(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConsumptionQuotaRequest request) {
        return ResponseEntity.ok(masterCatalogService.updateQuota(id, request));
    }
}
