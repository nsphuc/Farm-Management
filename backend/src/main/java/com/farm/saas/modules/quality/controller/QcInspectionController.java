package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.QcInspectionRequest;
import com.farm.saas.modules.quality.dto.response.QcInspectionDetailResponse;
import com.farm.saas.modules.quality.service.QcInspectionService;
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
@RequestMapping("/api/v1/farms/{farmId}/qc-inspections")
@RequiredArgsConstructor
public class QcInspectionController {

    private final QcInspectionService qcInspectionService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_QC_INSPECT') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<QcInspectionDetailResponse> createInspection(
            @PathVariable Long farmId,
            @Valid @RequestBody QcInspectionRequest request) {
        QcInspectionDetailResponse response = qcInspectionService.createInspection(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<QcInspectionDetailResponse>> getInspections(
            @PathVariable Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(qcInspectionService.getInspections(farmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<QcInspectionDetailResponse> getInspectionById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(qcInspectionService.getInspectionById(farmId, id));
    }
}
