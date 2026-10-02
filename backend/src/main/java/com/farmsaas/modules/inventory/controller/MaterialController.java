package com.farmsaas.modules.inventory.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    // --- MATERIAL CATEGORIES ---

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MaterialCategoryResponse>>> getCategories() {
        List<MaterialCategoryResponse> response = materialService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh mục nhóm vật tư thành công."));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<MaterialCategoryResponse>> createCategory(
            @Valid @RequestBody MaterialCategoryRequest request
    ) {
        MaterialCategoryResponse response = materialService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo nhóm vật tư thành công."));
    }

    @PutMapping("/categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<MaterialCategoryResponse>> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody MaterialCategoryRequest request
    ) {
        MaterialCategoryResponse response = materialService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật nhóm vật tư thành công."));
    }

    @DeleteMapping("/categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long categoryId
    ) {
        materialService.deleteCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa nhóm vật tư thành công."));
    }

    // --- MATERIALS ---

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<MaterialResponse>>> searchMaterials(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MaterialResponse> result = materialService.searchMaterials(categoryId, status, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm vật tư thành công."));
    }

    @GetMapping("/{materialId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MaterialResponse>> getMaterial(
            @PathVariable Long materialId
    ) {
        MaterialResponse response = materialService.getMaterial(materialId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết vật tư thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<MaterialResponse>> createMaterial(
            @Valid @RequestBody MaterialRequest request
    ) {
        MaterialResponse response = materialService.createMaterial(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thêm vật tư mới thành công."));
    }

    @PutMapping("/{materialId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<MaterialResponse>> updateMaterial(
            @PathVariable Long materialId,
            @Valid @RequestBody MaterialRequest request
    ) {
        MaterialResponse response = materialService.updateMaterial(materialId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vật tư thành công."));
    }

    @DeleteMapping("/{materialId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable Long materialId
    ) {
        materialService.deleteMaterial(materialId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa vật tư thành công."));
    }
}
