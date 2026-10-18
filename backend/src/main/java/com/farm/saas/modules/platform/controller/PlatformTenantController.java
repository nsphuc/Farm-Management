package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.request.CreateSubscriptionRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.farm.saas.modules.platform.dto.request.UpdateTenantStatusRequest;
import com.farm.saas.modules.platform.dto.response.TenantDetailResponse;
import com.farm.saas.modules.platform.service.PlatformTenantService;
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
@RequestMapping("/api/v1/platform/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PERM_TENANT_MANAGE')")
public class PlatformTenantController {

    private final PlatformTenantService platformTenantService;

    @PostMapping
    public ResponseEntity<TenantDetailResponse> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        TenantDetailResponse response = platformTenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<TenantDetailResponse>> getTenants(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<TenantDetailResponse> response = platformTenantService.getTenants(status, keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantDetailResponse> getTenantById(@PathVariable Long id) {
        TenantDetailResponse response = platformTenantService.getTenantById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TenantDetailResponse> updateTenantStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTenantStatusRequest request) {
        TenantDetailResponse response = platformTenantService.updateTenantStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/subscriptions")
    public ResponseEntity<TenantDetailResponse> addSubscription(
            @PathVariable Long id,
            @Valid @RequestBody CreateSubscriptionRequest request) {
        TenantDetailResponse response = platformTenantService.addSubscription(id, request);
        return ResponseEntity.ok(response);
    }
}
