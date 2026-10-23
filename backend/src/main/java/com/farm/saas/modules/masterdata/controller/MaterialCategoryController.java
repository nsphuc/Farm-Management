package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.masterdata.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/material-categories")
@RequiredArgsConstructor
public class MaterialCategoryController {

    private final MaterialService materialService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<List<MaterialCategoryResponse>> getCategories() {
        return ResponseEntity.ok(materialService.getCategories());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_RECEIPT', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<MaterialCategoryResponse> createCategory(@Valid @RequestBody CreateMaterialCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materialService.createCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_RECEIPT', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<MaterialCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMaterialCategoryRequest request) {
        return ResponseEntity.ok(materialService.updateCategory(id, request));
    }
}
