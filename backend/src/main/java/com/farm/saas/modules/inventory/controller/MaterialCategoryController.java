package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.request.MaterialCategoryCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialCategoryUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.inventory.service.MaterialCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

import java.util.List;

/**
 * Controller quản lý Nhóm vật tư nông nghiệp (Material Categories).
 * Base URL: /api/v1/material-categories
 * Thuộc Nhóm 3 - Quản lý Kho & Vật tư (3.2 Quản lý vật tư).
 */
@RestController
@RequestMapping("/api/v1/material-categories")
@RequiredArgsConstructor
@Tag(name = "Material Category Management", description = "APIs CRUD quản lý Danh mục Nhóm vật tư theo Tenant")
public class MaterialCategoryController {

    private final MaterialCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Lấy danh sách nhóm vật tư có phân trang (Yêu cầu PERM_INVENTORY_VIEW hoặc PERM_FINANCE_REPORT)")
    public ResponseEntity<ApiResponse<Page<MaterialCategoryResponse>>> getCategories(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MaterialCategoryResponse> categories = categoryService.getCategories(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm vật tư thành công", categories));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Lấy toàn bộ nhóm vật tư của Tenant (cho dropdown)")
    public ResponseEntity<ApiResponse<List<MaterialCategoryResponse>>> getAllCategories() {
        List<MaterialCategoryResponse> list = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm vật tư thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Xem thông tin chi tiết nhóm vật tư theo ID")
    public ResponseEntity<ApiResponse<MaterialCategoryResponse>> getCategoryById(@PathVariable("id") Long id) {
        MaterialCategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhóm vật tư thành công", category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Tạo mới nhóm vật tư (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<MaterialCategoryResponse>> createCategory(
            @Valid @RequestBody MaterialCategoryCreateRequest request) {
        MaterialCategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới nhóm vật tư thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Cập nhật tên nhóm vật tư (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<MaterialCategoryResponse>> updateCategory(
            @PathVariable("id") Long id,
            @Valid @RequestBody MaterialCategoryUpdateRequest request) {
        MaterialCategoryResponse updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhóm vật tư thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Xóa nhóm vật tư (Chặn xóa nếu còn mặt hàng vật tư trực thuộc)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhóm vật tư thành công", null));
    }
}
