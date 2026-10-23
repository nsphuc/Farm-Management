package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.request.CreatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerStatusRequest;
import com.farm.saas.modules.platform.dto.response.PartnerResponse;
import com.farm.saas.modules.platform.service.PartnerService;
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
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') or hasAuthority('PERM_INVENTORY_RECEIPT') or hasAuthority('PERM_FARM_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<Page<PartnerResponse>> getPartners(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) String partnerType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        String searchTerm = (search != null && !search.isBlank()) ? search : keyword;
        Page<PartnerResponse> response = partnerService.getPartners(farmId, partnerType, status, searchTerm, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') or hasAuthority('PERM_INVENTORY_RECEIPT') or hasAuthority('PERM_FARM_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<PartnerResponse> getPartnerById(@PathVariable Long id) {
        PartnerResponse response = partnerService.getPartnerById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<PartnerResponse> createPartner(@Valid @RequestBody CreatePartnerRequest request) {
        PartnerResponse response = partnerService.createPartner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<PartnerResponse> updatePartner(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartnerRequest request) {
        PartnerResponse response = partnerService.updatePartner(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<PartnerResponse> updatePartnerStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartnerStatusRequest request) {
        PartnerResponse response = partnerService.updatePartnerStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<Void> deletePartner(@PathVariable Long id) {
        partnerService.deletePartner(id);
        return ResponseEntity.noContent().build();
    }
}
