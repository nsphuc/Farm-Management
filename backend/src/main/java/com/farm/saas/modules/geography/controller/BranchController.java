package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.geography.dto.request.CreateBranchRequest;
import com.farm.saas.modules.geography.dto.request.UpdateBranchRequest;
import com.farm.saas.modules.geography.dto.response.BranchResponse;
import com.farm.saas.modules.geography.service.BranchService;
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
@RequestMapping("/api/v1/farms/{farmId}/branches")
@RequiredArgsConstructor
@Tag(name = "Farm Branches", description = "Quản lý Đa Chi Nhánh & Phân loại hình chăn nuôi (Gia súc, Gia cầm, Thủy sản)")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    @PreAuthorize("(hasAuthority('branches.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT', 'ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách chi nhánh", description = "Lấy chi nhánh thuộc trang trại (Chủ trại thấy toàn chuỗi, nhân viên chỉ thấy chi nhánh được gán)")
    public ResponseEntity<List<BranchResponse>> getBranches(@PathVariable Long farmId) {
        return ResponseEntity.ok(branchService.getBranches(farmId));
    }

    @GetMapping("/{branchId}")
    @PreAuthorize("(hasAuthority('branches.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT', 'ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết chi nhánh", description = "Lấy thông tin chi tiết của một chi nhánh")
    public ResponseEntity<BranchResponse> getBranchById(@PathVariable Long farmId, @PathVariable Long branchId) {
        return ResponseEntity.ok(branchService.getBranchById(farmId, branchId));
    }

    @PostMapping
    @PreAuthorize("(hasAuthority('branches.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Thêm mới chi nhánh", description = "Tạo một chi nhánh mới với loại hình LIVESTOCK_MEAT, POULTRY_MEAT hoặc AQUACULTURE")
    public ResponseEntity<BranchResponse> createBranch(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateBranchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(branchService.createBranch(farmId, request));
    }

    @PutMapping("/{branchId}")
    @PreAuthorize("(hasAuthority('branches.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật chi nhánh", description = "Chỉnh sửa tên, địa chỉ, loại hình hoặc đổi chi nhánh mặc định")
    public ResponseEntity<BranchResponse> updateBranch(
            @PathVariable Long farmId,
            @PathVariable Long branchId,
            @Valid @RequestBody UpdateBranchRequest request) {
        return ResponseEntity.ok(branchService.updateBranch(farmId, branchId, request));
    }

    @DeleteMapping("/{branchId}")
    @PreAuthorize("(hasAuthority('branches.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Xóa chi nhánh", description = "Xóa một chi nhánh phụ (không thể xóa chi nhánh mặc định)")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long farmId, @PathVariable Long branchId) {
        branchService.deleteBranch(farmId, branchId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{branchId}/set-default")
    @PreAuthorize("(hasAuthority('branches.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Đặt làm chi nhánh mặc định", description = "Chuyển chi nhánh chỉ định thành chi nhánh chính của trang trại")
    public ResponseEntity<BranchResponse> setDefaultBranch(@PathVariable Long farmId, @PathVariable Long branchId) {
        return ResponseEntity.ok(branchService.setDefaultBranch(farmId, branchId));
    }
}
