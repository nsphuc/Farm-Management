package com.farm.saas.modules.crop.controller;

import com.farm.saas.modules.crop.dto.request.CreateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.request.UpdateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.response.CropSeasonDetailResponse;
import com.farm.saas.modules.crop.service.CropSeasonService;
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

@RestController
@RequestMapping("/api/v1/farms/{farmId}/crop-seasons")
@RequiredArgsConstructor
@Tag(name = "Crop Seasons", description = "Quản lý mùa vụ canh tác trồng trọt")
public class CropSeasonController {

    private final CropSeasonService cropSeasonService;

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_CROP_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách mùa vụ", description = "Lấy danh sách các mùa vụ có phân trang và lọc theo trạng thái")
    public ResponseEntity<Page<CropSeasonDetailResponse>> getSeasons(
            @PathVariable Long farmId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(cropSeasonService.getSeasons(farmId, status, keyword, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_CROP_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết mùa vụ", description = "Lấy chi tiết mùa vụ kèm kiểm tra thời gian cách ly PHI và tổng chi phí")
    public ResponseEntity<CropSeasonDetailResponse> getSeasonById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(cropSeasonService.getSeasonById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo mùa vụ mới", description = "Thiết lập kế hoạch mùa vụ mới với diện tích và giống cây trồng")
    public ResponseEntity<CropSeasonDetailResponse> createSeason(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateCropSeasonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cropSeasonService.createSeason(farmId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật mùa vụ", description = "Cập nhật ngày thu hoạch thực tế, sản lượng hoặc trạng thái mùa vụ")
    public ResponseEntity<CropSeasonDetailResponse> updateSeason(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCropSeasonRequest request) {
        return ResponseEntity.ok(cropSeasonService.updateSeason(farmId, id, request));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN') and @farmSecurity.isFarmManager(#farmId)")
    @Operation(summary = "Đóng mùa vụ", description = "Đóng mùa vụ và ghi nhận ngày thu hoạch thực tế")
    public ResponseEntity<CropSeasonDetailResponse> closeSeason(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(cropSeasonService.closeSeason(farmId, id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CROP_PLAN') and @farmSecurity.isFarmManager(#farmId)")
    @Operation(summary = "Xóa mùa vụ", description = "Xóa hoặc đóng mùa vụ")
    public ResponseEntity<Void> deleteSeason(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        cropSeasonService.deleteSeason(farmId, id);
        return ResponseEntity.noContent().build();
    }
}
