package com.farm.saas.security.authorization;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.security.auth.CustomUserDetails;
import com.farm.saas.security.scope.TheFarmBarrierGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@Tag(name = "Farm Security & Barrier Guard", description = "Endpoints kiểm thử phân quyền RBAC và rào chắn Farm Barrier Guard")
public class TestFarmSecurityController {

    @PostMapping("/farms")
    @PreAuthorize("hasAuthority('PERM_FARM_CREATE')")
    @Operation(summary = "Tạo trang trại mới (Yêu cầu PERM_FARM_CREATE)")
    public ResponseEntity<ApiResponse<String>> createFarm() {
        return ResponseEntity.ok(ApiResponse.success("Tạo trang trại thành công", "FARM_CREATED"));
    }

    @GetMapping("/farms/{farmId}")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Chi tiết trang trại (The Farm Barrier Guard)")
    public ResponseEntity<ApiResponse<String>> getFarmDetails(@PathVariable("farmId") Long farmId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin trang trại thành công", "FARM_DETAILS_" + farmId));
    }

    @GetMapping("/tenants/{tenantId}/data")
    @TheFarmBarrierGuard(tenantParam = "tenantId")
    @Operation(summary = "Dữ liệu tenant (Tenant Isolation)")
    public ResponseEntity<ApiResponse<String>> getTenantData(@PathVariable("tenantId") Long tenantId) {
        return ResponseEntity.ok(ApiResponse.success("Dữ liệu tenant hợp lệ", "TENANT_DATA_" + tenantId));
    }

    @GetMapping("/whoami")
    @Operation(summary = "Xác minh thông tin phiên hiện tại")
    public ResponseEntity<ApiResponse<Long>> verifyTenantPrincipal(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Xác nhận tenant", userDetails.getTenantId()));
    }
}
