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
}
