package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import com.farm.saas.modules.quality.service.HarvestService;
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
@RequestMapping("/api/v1/farms/{farmId}/harvest-records")
@RequiredArgsConstructor
public class HarvestController {

    private final HarvestService harvestService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_HARVEST_MANAGE') and hasAnyRole('ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<HarvestRecordDetailResponse> createHarvestRecord(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateHarvestRecordRequest request) {
        HarvestRecordDetailResponse response = harvestService.createHarvestRecord(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<HarvestRecordDetailResponse>> getHarvestRecords(
            @PathVariable Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(harvestService.getHarvestRecords(farmId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<HarvestRecordDetailResponse> getHarvestRecordById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(harvestService.getHarvestRecordById(farmId, id));
    }
}
