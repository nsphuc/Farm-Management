package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateCropTypeRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateCropTypeRequest;
import com.farm.saas.modules.masterdata.dto.response.CropTypeResponse;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/master/crop-types")
@RequiredArgsConstructor
public class CropTypeController {

    private final MasterCatalogService masterCatalogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CROP_VIEW')")
    public ResponseEntity<List<CropTypeResponse>> getCropTypes() {
        return ResponseEntity.ok(masterCatalogService.getCropTypes());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CROP_VIEW')")
    public ResponseEntity<CropTypeResponse> getCropTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(masterCatalogService.getCropTypeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN')")
    public ResponseEntity<CropTypeResponse> createCropType(@Valid @RequestBody CreateCropTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterCatalogService.createCropType(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN')")
    public ResponseEntity<CropTypeResponse> updateCropType(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCropTypeRequest request) {
        return ResponseEntity.ok(masterCatalogService.updateCropType(id, request));
    }
}
