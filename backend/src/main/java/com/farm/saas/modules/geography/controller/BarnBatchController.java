package com.farm.saas.modules.geography.controller;

import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.modules.geography.dto.request.*;
import com.farm.saas.modules.geography.dto.response.*;
import com.farm.saas.modules.geography.service.BarnBatchService;
import com.farm.saas.modules.livestock.dto.request.CreateBatchRequest;
import com.farm.saas.modules.livestock.dto.request.SplitBatchRequest;
import com.farm.saas.modules.livestock.dto.response.BatchDetailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Barns & Batches", description = "Quản lý Phân khu, Chuồng nuôi và Vòng đời Lứa nuôi")
public class BarnBatchController {

    private final BarnBatchService barnBatchService;
    private final FarmSecurityEvaluator farmSecurity;

    // ==========================================
    // 1. ZONES (/api/v1/zones)
    // ==========================================

    @GetMapping("/zones")
    @PreAuthorize("(hasAnyAuthority('barns.view', 'PERM_FARM_VIEW', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF', 'ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách khu nuôi")
    public ResponseEntity<List<ProductionZoneResponse>> getZones(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId) {
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(farmId, branchId);
        return ResponseEntity.ok(barnBatchService.getZones(farmId, effectiveBranchId));
    }

    @PostMapping("/zones")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Tạo khu nuôi mới")
    public ResponseEntity<ProductionZoneResponse> createZone(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateProductionZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(barnBatchService.createZone(farmId, request));
    }

    @PutMapping("/zones/{id}")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Cập nhật khu nuôi")
    public ResponseEntity<ProductionZoneResponse> updateZone(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductionZoneRequest request) {
        return ResponseEntity.ok(barnBatchService.updateZone(farmId, id, request));
    }

    @DeleteMapping("/zones/{id}")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa khu nuôi")
    public ResponseEntity<Void> deleteZone(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        barnBatchService.deleteZone(farmId, id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 2. BARNS (/api/v1/barns)
    // ==========================================

    @GetMapping("/barns")
    @PreAuthorize("(hasAnyAuthority('barns.view', 'PERM_FARM_VIEW', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF', 'ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Danh sách thẻ chuồng nuôi (Grid view)", description = "Lấy danh sách chuồng nuôi, tự động lọc theo allowedBarnIds nếu là công nhân chuồng")
    public ResponseEntity<List<BarnCardResponse>> getBarns(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId) {
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(farmId, branchId);
        return ResponseEntity.ok(barnBatchService.getBarns(farmId, effectiveBranchId));
    }

    @PostMapping("/barns")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Tạo chuồng nuôi mới")
    public ResponseEntity<ZoneLocationResponse> createBarn(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateZoneLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(barnBatchService.createBarn(farmId, request));
    }

    @PutMapping("/barns/{id}")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Cập nhật chuồng nuôi")
    public ResponseEntity<ZoneLocationResponse> updateBarn(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateZoneLocationRequest request) {
        return ResponseEntity.ok(barnBatchService.updateBarn(farmId, id, request));
    }

    @DeleteMapping("/barns/{id}")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_ZONE_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa chuồng nuôi")
    public ResponseEntity<Void> deleteBarn(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        barnBatchService.deleteBarn(farmId, id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 3. BATCHES (/api/v1/batches)
    // ==========================================

    @GetMapping({"/batches/{id}", "/batches/{id}/detail"})
    @PreAuthorize("hasAnyAuthority('barns.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF', 'ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Chi tiết toàn diện lứa nuôi (Kỹ thuật, hạch toán, thu hoạch)")
    public ResponseEntity<BatchDetailResponse> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(barnBatchService.getBatchById(id));
    }

    @PutMapping("/batches/{id}/targets")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Cài đặt chỉ tiêu kỹ thuật riêng cho lứa nuôi")
    public ResponseEntity<BatchDetailResponse> updateTargets(
            @PathVariable Long id,
            @Valid @RequestBody com.farm.saas.modules.livestock.dto.request.BatchTargetsRequest request) {
        return ResponseEntity.ok(barnBatchService.updateTargets(id, request));
    }

    @PostMapping("/batches/{id}/groups")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Nhập bổ sung đợt con giống mới vào lứa nuôi")
    public ResponseEntity<BatchDetailResponse> addGroup(
            @PathVariable Long id,
            @Valid @RequestBody com.farm.saas.modules.livestock.dto.request.AddBatchGroupRequest request) {
        return ResponseEntity.ok(barnBatchService.addGroup(id, request));
    }

    @PostMapping("/batches/{id}/programs")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Gắn chương trình định mức cám hoặc phòng bệnh vào lứa nuôi")
    public ResponseEntity<BatchDetailResponse> applyProgram(
            @PathVariable Long id,
            @Valid @RequestBody com.farm.saas.modules.livestock.dto.request.ApplyProgramRequest request) {
        return ResponseEntity.ok(barnBatchService.applyProgram(id, request));
    }

    @DeleteMapping("/batches/{id}/programs/{programId}")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Gỡ bỏ chương trình nuôi khỏi lứa nuôi")
    public ResponseEntity<BatchDetailResponse> removeProgram(
            @PathVariable Long id,
            @PathVariable Long programId) {
        return ResponseEntity.ok(barnBatchService.removeProgram(id, programId));
    }

    @PostMapping("/batches/{id}/by-products")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Ghi nhận khoản phụ thu (bán phân, bao bì rỗng) của chuồng")
    public ResponseEntity<BatchDetailResponse> addByProduct(
            @PathVariable Long id,
            @Valid @RequestBody com.farm.saas.modules.livestock.dto.request.AddByProductRequest request) {
        return ResponseEntity.ok(barnBatchService.addByProduct(id, request));
    }

    @PostMapping("/batches")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Mở lứa nuôi mới tại chuồng")
    public ResponseEntity<BatchDetailResponse> createBatch(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateBatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(barnBatchService.createBatch(farmId, request));
    }

    @PostMapping("/batches/{id}/split")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Tách đàn / Chuyển chuồng")
    public ResponseEntity<BatchDetailResponse> splitBatch(
            @PathVariable Long id,
            @Valid @RequestBody SplitBatchRequest request) {
        return ResponseEntity.ok(barnBatchService.splitBatch(id, request));
    }

    @PostMapping("/batches/{id}/close")
    @PreAuthorize("hasAnyAuthority('barns.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Đóng / Kết thúc lứa nuôi")
    public ResponseEntity<BatchDetailResponse> closeBatch(@PathVariable Long id) {
        return ResponseEntity.ok(barnBatchService.closeBatch(id));
    }
}
