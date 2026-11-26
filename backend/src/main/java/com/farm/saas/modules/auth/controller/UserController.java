package com.farm.saas.modules.auth.controller;

import com.farm.saas.modules.auth.dto.request.CreateUserRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserRolesRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserStatusRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import com.farm.saas.modules.auth.dto.response.UserDetailResponse;
import com.farm.saas.modules.auth.service.UserService;
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

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/api/v1/users")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<UserDetailResponse>> getUsers(
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userService.getUsers(tenantId, status, roleId, keyword, pageable));
    }

    @GetMapping("/api/v1/users/{id}")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/api/v1/users")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDetailResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PutMapping("/api/v1/users/{id}/roles")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDetailResponse> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        return ResponseEntity.ok(userService.updateUserRoles(id, request));
    }

    @PutMapping("/api/v1/users/{id}/status")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDetailResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request));
    }

    @PostMapping("/api/v1/users/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> resetPassword(
            @PathVariable Long id,
            @RequestBody(required = false) com.farm.saas.modules.auth.dto.request.ResetPasswordRequest request) {
        return ResponseEntity.ok(userService.resetPassword(id, request));
    }

    @GetMapping("/api/v1/system/roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RoleMatrixResponse>> getSystemRoles() {
        return ResponseEntity.ok(userService.getSystemRoles());
    }

    @GetMapping("/api/v1/system/permissions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RoleMatrixResponse.PermissionDto>> getAllPermissions() {
        return ResponseEntity.ok(userService.getAllPermissions());
    }

    @GetMapping("/api/v1/farms/{farmId}/roles")
    @PreAuthorize("hasAuthority('general_settings.view') or hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<List<RoleMatrixResponse>> getRolesForFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(userService.getRolesForFarm(farmId));
    }

    @PostMapping("/api/v1/farms/{farmId}/roles")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<RoleMatrixResponse> createCustomRole(
            @PathVariable Long farmId,
            @Valid @RequestBody com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createCustomRole(farmId, request));
    }

    @PutMapping("/api/v1/farms/{farmId}/roles/{roleId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<RoleMatrixResponse> updateCustomRole(
            @PathVariable Long farmId,
            @PathVariable Long roleId,
            @Valid @RequestBody com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest request) {
        return ResponseEntity.ok(userService.updateCustomRole(farmId, roleId, request));
    }

    @DeleteMapping("/api/v1/farms/{farmId}/roles/{roleId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<Void> deleteCustomRole(
            @PathVariable Long farmId,
            @PathVariable Long roleId) {
        userService.deleteCustomRole(farmId, roleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/farms/{farmId}/members")
    @PreAuthorize("hasAuthority('general_settings.view') or hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<List<com.farm.saas.modules.auth.dto.response.FarmMemberResponse>> getFarmMembers(
            @PathVariable Long farmId) {
        return ResponseEntity.ok(userService.getFarmMembers(farmId));
    }

    @PostMapping("/api/v1/farms/{farmId}/members")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<com.farm.saas.modules.auth.dto.response.FarmMemberResponse> upsertFarmMember(
            @PathVariable Long farmId,
            @Valid @RequestBody com.farm.saas.modules.auth.dto.request.FarmMemberRequest request) {
        return ResponseEntity.ok(userService.upsertFarmMember(farmId, request));
    }

    @DeleteMapping("/api/v1/farms/{farmId}/members/{userId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<Void> removeFarmMember(
            @PathVariable Long farmId,
            @PathVariable Long userId) {
        userService.removeFarmMember(farmId, userId);
        return ResponseEntity.noContent().build();
    }
}
