package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.geography.dto.request.CreateFarmRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmStatusRequest;
import com.farm.saas.modules.geography.dto.response.FarmDetailResponse;
import com.farm.saas.modules.geography.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    public ResponseEntity<Page<FarmDetailResponse>> getFarms(
            @RequestParam(required = false) String farmType,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(farmService.getFarms(farmType, keyword, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FARM_CREATE')")
    public ResponseEntity<FarmDetailResponse> createFarm(@Valid @RequestBody CreateFarmRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmService.createFarm(request));
    }

    @GetMapping("/{farmId}")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmDetailResponse> getFarmById(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmService.getFarmById(farmId));
    }

    @PutMapping("/{farmId}")
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmDetailResponse> updateFarm(
            @PathVariable Long farmId,
            @Valid @RequestBody UpdateFarmRequest request) {
        return ResponseEntity.ok(farmService.updateFarm(farmId, request));
    }

    @RequestMapping(value = "/{farmId}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("(hasAuthority('PERM_FARM_UPDATE') or hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmDetailResponse> updateFarmStatus(
            @PathVariable Long farmId,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestParam(required = false) String status) {
        String effectiveStatus = status;
        if ((effectiveStatus == null || effectiveStatus.isBlank()) && body != null) {
            Object statusObj = body.get("status");
            if (statusObj != null) {
                effectiveStatus = statusObj.toString();
            }
        }
        return ResponseEntity.ok(farmService.updateFarmStatus(farmId, effectiveStatus));
    }
}
