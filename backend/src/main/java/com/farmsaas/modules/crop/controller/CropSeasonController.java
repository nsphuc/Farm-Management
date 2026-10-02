package com.farmsaas.modules.crop.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.crop.dto.CropSeasonRequest;
import com.farmsaas.modules.crop.dto.CropSeasonResponse;
import com.farmsaas.modules.crop.dto.HarvestSeasonRequest;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import com.farmsaas.modules.crop.service.CropSeasonService;
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

@RestController
@RequestMapping("/api/v1/farms/{farmId}/seasons")
@RequiredArgsConstructor
public class CropSeasonController {

    private final CropSeasonService cropSeasonService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<CropSeasonResponse>>> searchSeasons(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long cropTypeId,
            @RequestParam(required = false) SeasonStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CropSeasonResponse> result = cropSeasonService.searchSeasons(farmId, zoneId, cropTypeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm vụ mùa thành công."));
    }

    @GetMapping("/{seasonId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CropSeasonResponse>> getSeasonById(
            @PathVariable Long farmId,
            @PathVariable Long seasonId
    ) {
        CropSeasonResponse response = cropSeasonService.getSeasonById(farmId, seasonId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết vụ mùa thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<CropSeasonResponse>> createSeason(
            @PathVariable Long farmId,
            @Valid @RequestBody CropSeasonRequest request
    ) {
        CropSeasonResponse response = cropSeasonService.createSeason(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Khởi tạo vụ mùa mới thành công."));
    }

    @PutMapping("/{seasonId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<CropSeasonResponse>> updateSeason(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @Valid @RequestBody CropSeasonRequest request
    ) {
        CropSeasonResponse response = cropSeasonService.updateSeason(farmId, seasonId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vụ mùa thành công."));
    }

    @PatchMapping("/{seasonId}/harvest")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<CropSeasonResponse>> harvestSeason(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @Valid @RequestBody HarvestSeasonRequest request
    ) {
        CropSeasonResponse response = cropSeasonService.harvestSeason(farmId, seasonId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Ghi nhận thu hoạch vụ mùa thành công."));
    }

    @PatchMapping("/{seasonId}/status")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<CropSeasonResponse>> updateStatus(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @RequestParam SeasonStatus status
    ) {
        CropSeasonResponse response = cropSeasonService.updateStatus(farmId, seasonId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái vụ mùa thành công."));
    }

    @DeleteMapping("/{seasonId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteSeason(
            @PathVariable Long farmId,
            @PathVariable Long seasonId
    ) {
        cropSeasonService.deleteSeason(farmId, seasonId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa vụ mùa thành công."));
    }
}
