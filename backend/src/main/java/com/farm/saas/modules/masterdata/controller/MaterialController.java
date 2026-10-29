package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateUnitConversionRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.response.BarcodeLookupResponse;
import com.farm.saas.modules.masterdata.dto.response.MaterialDetailResponse;
import com.farm.saas.modules.masterdata.service.MaterialService;
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
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping("/api/v1/materials")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<Page<MaterialDetailResponse>> getMaterials(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(materialService.getMaterials(categoryId, keyword, pageable));
    }

    @GetMapping("/api/v1/materials/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<MaterialDetailResponse> getMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(materialService.getMaterialById(id));
    }

    @PostMapping("/api/v1/materials")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_RECEIPT', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<MaterialDetailResponse> createMaterial(@Valid @RequestBody CreateMaterialRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materialService.createMaterial(request));
    }

    @PutMapping("/api/v1/materials/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<MaterialDetailResponse> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMaterialRequest request) {
        return ResponseEntity.ok(materialService.updateMaterial(id, request));
    }

    @DeleteMapping("/api/v1/materials/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/materials/{id}/conversions")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_RECEIPT', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<MaterialDetailResponse> addConversion(
            @PathVariable Long id,
            @Valid @RequestBody CreateUnitConversionRequest request) {
        return ResponseEntity.ok(materialService.addConversion(id, request));
    }

    // Unified Barcode Scanner
    @GetMapping("/api/v1/farms/{farmId}/materials/lookup-barcode")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<BarcodeLookupResponse> lookupBarcode(
            @PathVariable Long farmId,
            @RequestParam String code) {
        return ResponseEntity.ok(materialService.lookupBarcode(farmId, code));
    }
}
