package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.FarmCreateRequest;
import com.farm.saas.modules.organization.dto.request.FarmUpdateRequest;
import com.farm.saas.modules.organization.dto.response.FarmResponse;
import com.farm.saas.modules.organization.service.FarmService;
import com.farm.saas.security.scope.TheFarmBarrierGuard;
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
 * Controller quản lý Trang trại (Farms).
 * Base URL: /api/v1/farms
 * Áp dụng phân quyền RBAC và kiểm soát Tenant Isolation chặt chẽ.
 */
@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
@Tag(name = "Farm Management", description = "APIs CRUD quản lý danh mục Trang trại trực thuộc Tenant")
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @Operation(summary = "Lấy danh sách trang trại có phân trang (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<Page<FarmResponse>>> getFarms(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FarmResponse> farms = farmService.getFarms(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách trang trại thành công", farms));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @Operation(summary = "Lấy toàn bộ danh sách trang trại của Tenant (Dropdown/Select box)")
    public ResponseEntity<ApiResponse<List<FarmResponse>>> getAllFarms() {
        List<FarmResponse> farms = farmService.getAllFarms();
        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ danh sách trang trại thành công", farms));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "id", requireFarm = true)
    @Operation(summary = "Xem chi tiết thông tin trang trại (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<FarmResponse>> getFarmById(@PathVariable("id") Long id) {
        FarmResponse farm = farmService.getFarmById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin trang trại thành công", farm));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_FARM_CREATE')")
    @Operation(summary = "Tạo mới trang trại (Yêu cầu PERM_FARM_CREATE)")
    public ResponseEntity<ApiResponse<FarmResponse>> createFarm(@Valid @RequestBody FarmCreateRequest request) {
        FarmResponse created = farmService.createFarm(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới trang trại thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "id", requireFarm = true)
    @Operation(summary = "Cập nhật thông tin trang trại (Yêu cầu PERM_FARM_UPDATE)")
    public ResponseEntity<ApiResponse<FarmResponse>> updateFarm(
            @PathVariable("id") Long id,
            @Valid @RequestBody FarmUpdateRequest request) {
        FarmResponse updated = farmService.updateFarm(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin trang trại thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "id", requireFarm = true)
    @Operation(summary = "Vô hiệu hóa trang trại (Soft-delete: status=INACTIVE)")
    public ResponseEntity<ApiResponse<Void>> deleteFarm(@PathVariable("id") Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa trang trại thành công", null));
    }
}
