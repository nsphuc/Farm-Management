package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.ZoneLocationCreateRequest;
import com.farm.saas.modules.organization.dto.request.ZoneLocationUpdateRequest;
import com.farm.saas.modules.organization.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.organization.service.ZoneLocationService;
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
 * Controller quản lý Vị trí chi tiết trong phân khu (Zone Locations: Luống, Ô đất, Dãy chuồng).
 * Base URL: /api/v1/farms/{farmId}/zones/{zoneId}/locations
 * Áp dụng The Farm Barrier Guard (farmId) và RBAC permissions.
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/zones/{zoneId}/locations")
@RequiredArgsConstructor
@Tag(name = "Zone Location Management", description = "APIs CRUD quản lý Vị trí chi tiết (Luống, Ô đất, Dãy chuồng) trong Phân khu sản xuất")
public class ZoneLocationController {

    private final ZoneLocationService zoneLocationService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy danh sách toàn bộ vị trí thuộc phân khu (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<List<ZoneLocationResponse>>> getLocationsByZone(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId) {
        List<ZoneLocationResponse> locations = zoneLocationService.getLocationsByZone(farmId, zoneId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vị trí thành công", locations));
    }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Phân trang danh sách vị trí thuộc phân khu (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<Page<ZoneLocationResponse>>> getLocationsPage(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ZoneLocationResponse> page = zoneLocationService.getLocationsByZone(farmId, zoneId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vị trí thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Xem chi tiết vị trí canh tác (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<ZoneLocationResponse>> getLocationById(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId,
            @PathVariable("id") Long id) {
        ZoneLocationResponse location = zoneLocationService.getLocationById(farmId, zoneId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin vị trí thành công", location));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Tạo mới vị trí chi tiết trong phân khu (Yêu cầu PERM_ZONE_MANAGE)")
    public ResponseEntity<ApiResponse<ZoneLocationResponse>> createLocation(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId,
            @Valid @RequestBody ZoneLocationCreateRequest request) {
        ZoneLocationResponse created = zoneLocationService.createLocation(farmId, zoneId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới vị trí thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Cập nhật vị trí chi tiết (Yêu cầu PERM_ZONE_MANAGE)")
    public ResponseEntity<ApiResponse<ZoneLocationResponse>> updateLocation(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId,
            @PathVariable("id") Long id,
            @Valid @RequestBody ZoneLocationUpdateRequest request) {
        ZoneLocationResponse updated = zoneLocationService.updateLocation(farmId, zoneId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vị trí thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Đưa vị trí vào trạng thái bảo trì (Soft-delete: status=MAINTENANCE)")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(
            @PathVariable("farmId") Long farmId,
            @PathVariable("zoneId") Long zoneId,
            @PathVariable("id") Long id) {
        zoneLocationService.deleteLocation(farmId, zoneId, id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa vị trí thành công", null));
    }
}
