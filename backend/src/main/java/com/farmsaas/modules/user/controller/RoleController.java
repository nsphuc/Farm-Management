package com.farmsaas.modules.user.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.user.dto.PermissionResponse;
import com.farmsaas.modules.user.dto.RoleResponse;
import com.farmsaas.modules.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_OWNER')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> roles = roleService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success(roles, "Lấy danh sách vai trò thành công."));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_OWNER')")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        List<PermissionResponse> permissions = roleService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success(permissions, "Lấy danh sách quyền hạn thành công."));
    }
}
