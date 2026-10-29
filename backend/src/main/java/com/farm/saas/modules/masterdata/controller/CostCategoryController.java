package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateCostCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateCostCategoryRequest;
import com.farm.saas.modules.masterdata.dto.response.CostCategoryResponse;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cost-categories")
@RequiredArgsConstructor
public class CostCategoryController {

    private final MasterCatalogService masterCatalogService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<List<CostCategoryResponse>> getCostCategories() {
        return ResponseEntity.ok(masterCatalogService.getCostCategories());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<CostCategoryResponse> createCostCategory(@Valid @RequestBody CreateCostCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterCatalogService.createCostCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<CostCategoryResponse> updateCostCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCostCategoryRequest request) {
        return ResponseEntity.ok(masterCatalogService.updateCostCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<Void> deleteCostCategory(@PathVariable Long id) {
        masterCatalogService.deleteCostCategory(id);
        return ResponseEntity.noContent().build();
    }
}
