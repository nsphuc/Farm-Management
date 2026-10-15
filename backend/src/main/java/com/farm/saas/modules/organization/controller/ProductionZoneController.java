package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.ProductionZoneCreateRequest;
import com.farm.saas.modules.organization.dto.request.ProductionZoneUpdateRequest;
import com.farm.saas.modules.organization.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.organization.service.ProductionZoneService;
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
 * Controller quản lý Phân khu sản xuất (Production Zones: Nhà màng, Nhà kính, Đồng ruộng, Chuồng trại).
 * Base URL: /api/v1/farms/{farmId}/zones
 * Áp dụng The Farm Barrier Guard (farmId) và RBAC permissions.
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/zones")
@RequiredArgsConstructor
@Tag(name = "Production Zone Management", description = "APIs CRUD quản lý Phân khu sản xuất trong Trang trại")
public class ProductionZoneController {

    private final ProductionZoneService productionZoneService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy danh sách toàn bộ phân khu thuộc trang trại (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<List<ProductionZoneResponse>>> getZonesByFarmId(@PathVariable("farmId") Long farmId) {
        List<ProductionZoneResponse> zones = productionZoneService.getZonesByFarmId(farmId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phân khu thành công", zones));
    }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Phân trang danh sách phân khu thuộc trang trại (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<Page<ProductionZoneResponse>>> getZonesPage(
            @PathVariable("farmId") Long farmId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProductionZoneResponse> page = productionZoneService.getZonesByFarmId(farmId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phân khu thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Xem chi tiết phân khu sản xuất (Yêu cầu PERM_FARM_VIEW)")
    public ResponseEntity<ApiResponse<ProductionZoneResponse>> getZoneById(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        ProductionZoneResponse zone = productionZoneService.getZoneById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phân khu thành công", zone));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Tạo mới phân khu sản xuất (Yêu cầu PERM_ZONE_MANAGE)")
    public ResponseEntity<ApiResponse<ProductionZoneResponse>> createZone(
            @PathVariable("farmId") Long farmId,
            @Valid @RequestBody ProductionZoneCreateRequest request) {
        ProductionZoneResponse created = productionZoneService.createZone(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới phân khu thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Cập nhật phân khu sản xuất (Yêu cầu PERM_ZONE_MANAGE)")
    public ResponseEntity<ApiResponse<ProductionZoneResponse>> updateZone(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id,
            @Valid @RequestBody ProductionZoneUpdateRequest request) {
        ProductionZoneResponse updated = productionZoneService.updateZone(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phân khu thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Đưa phân khu vào trạng thái bảo trì (Soft-delete: status=MAINTENANCE)")
    public ResponseEntity<ApiResponse<Void>> deleteZone(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        productionZoneService.deleteZone(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa phân khu thành công", null));
    }
}
