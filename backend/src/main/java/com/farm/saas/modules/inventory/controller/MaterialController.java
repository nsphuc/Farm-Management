package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.request.MaterialCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialResponse;
import com.farm.saas.modules.inventory.service.MaterialService;
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
 * Controller quản lý Danh mục Mặt hàng / Vật tư nông nghiệp (Materials).
 * Base URL: /api/v1/materials
 * Thuộc Nhóm 3 - Quản lý Kho & Vật tư (3.2 Quản lý vật tư).
 */
@RestController
@RequestMapping("/api/v1/materials")
@RequiredArgsConstructor
@Tag(name = "Material Management", description = "APIs CRUD quản lý Mặt hàng / Vật tư nông nghiệp theo Tenant")
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Lấy danh sách vật tư có phân trang (Yêu cầu PERM_INVENTORY_VIEW hoặc PERM_FINANCE_REPORT)")
    public ResponseEntity<ApiResponse<Page<MaterialResponse>>> getMaterials(
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MaterialResponse> materials = materialService.getMaterials(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vật tư thành công", materials));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Lấy toàn bộ danh sách vật tư của Tenant (dành cho dropdown/select)")
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getAllMaterials(
            @RequestParam(value = "categoryId", required = false) Long categoryId) {
        List<MaterialResponse> materials = materialService.getAllMaterials(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vật tư thành công", materials));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Xem thông tin chi tiết vật tư theo ID")
    public ResponseEntity<ApiResponse<MaterialResponse>> getMaterialById(@PathVariable("id") Long id) {
        MaterialResponse material = materialService.getMaterialById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin vật tư thành công", material));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Tạo mới vật tư nông nghiệp (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<MaterialResponse>> createMaterial(
            @Valid @RequestBody MaterialCreateRequest request) {
        MaterialResponse created = materialService.createMaterial(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới vật tư thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Cập nhật thông tin vật tư (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<MaterialResponse>> updateMaterial(
            @PathVariable("id") Long id,
            @Valid @RequestBody MaterialUpdateRequest request) {
        MaterialResponse updated = materialService.updateMaterial(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin vật tư thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Xóa mặt hàng vật tư")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(@PathVariable("id") Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa vật tư thành công", null));
    }
}
