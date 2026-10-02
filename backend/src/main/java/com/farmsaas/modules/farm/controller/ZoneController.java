package com.farmsaas.modules.farm.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.farm.dto.*;
import com.farmsaas.modules.farm.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getZones(@PathVariable Long farmId) {
        List<ZoneResponse> zones = zoneService.getZonesByFarmId(farmId);
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách phân khu thành công."));
    }

    @GetMapping("/{zoneId}")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneResponse>> getZoneById(
            @PathVariable Long farmId,
            @PathVariable Long zoneId
    ) {
        ZoneResponse response = zoneService.getZoneById(farmId, zoneId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết phân khu thành công."));
    }

    @PostMapping
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneResponse>> createZone(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateZoneRequest request
    ) {
        ZoneResponse response = zoneService.createZone(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo phân khu mới thành công."));
    }

    @PutMapping("/{zoneId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneResponse>> updateZone(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @Valid @RequestBody UpdateZoneRequest request
    ) {
        ZoneResponse response = zoneService.updateZone(farmId, zoneId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật phân khu thành công."));
    }

    @PatchMapping("/{zoneId}/status")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneResponse>> updateZoneStatus(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        ZoneResponse response = zoneService.updateZoneStatus(farmId, zoneId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái phân khu thành công."));
    }

    @DeleteMapping("/{zoneId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<Void>> deleteZone(
            @PathVariable Long farmId,
            @PathVariable Long zoneId
    ) {
        zoneService.deleteZone(farmId, zoneId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa phân khu thành công."));
    }

    // Zone Locations Endpoints
    @GetMapping("/{zoneId}/locations")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<List<ZoneLocationResponse>>> getLocations(
            @PathVariable Long farmId,
            @PathVariable Long zoneId
    ) {
        List<ZoneLocationResponse> list = zoneService.getLocationsByZoneId(farmId, zoneId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách vị trí trong phân khu thành công."));
    }

    @PostMapping("/{zoneId}/locations")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneLocationResponse>> createLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @Valid @RequestBody CreateZoneLocationRequest request
    ) {
        ZoneLocationResponse response = zoneService.createLocation(farmId, zoneId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo vị trí / ô mới thành công."));
    }

    @PutMapping("/{zoneId}/locations/{locId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<ZoneLocationResponse>> updateLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @PathVariable Long locId,
            @Valid @RequestBody UpdateZoneLocationRequest request
    ) {
        ZoneLocationResponse response = zoneService.updateLocation(farmId, zoneId, locId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vị trí / ô thành công."));
    }

    @DeleteMapping("/{zoneId}/locations/{locId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @PathVariable Long locId
    ) {
        zoneService.deleteLocation(farmId, zoneId, locId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa vị trí / ô thành công."));
    }
}
