package com.farm.saas.modules.auth.service;

import com.farm.saas.modules.auth.dto.request.CreateUserRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserRolesRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserStatusRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import com.farm.saas.modules.auth.dto.response.UserDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    Page<UserDetailResponse> getUsers(String status, Long roleId, String keyword, Pageable pageable);
    Page<UserDetailResponse> getUsers(Long tenantId, String status, Long roleId, String keyword, Pageable pageable);
    UserDetailResponse getUserById(Long id);
    UserDetailResponse createUser(CreateUserRequest request);
    UserDetailResponse updateUserRoles(Long id, UpdateUserRolesRequest request);
    UserDetailResponse updateUserStatus(Long id, UpdateUserStatusRequest request);
    java.util.Map<String, Object> resetPassword(Long id, com.farm.saas.modules.auth.dto.request.ResetPasswordRequest request);
    List<RoleMatrixResponse> getSystemRoles();
    List<RoleMatrixResponse> getRolesForFarm(Long farmId);
    RoleMatrixResponse createCustomRole(Long farmId, com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest request);
    RoleMatrixResponse updateCustomRole(Long farmId, Long roleId, com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest request);
    void deleteCustomRole(Long farmId, Long roleId);
    List<RoleMatrixResponse.PermissionDto> getAllPermissions();
    List<com.farm.saas.modules.auth.dto.response.FarmMemberResponse> getFarmMembers(Long farmId);
    com.farm.saas.modules.auth.dto.response.FarmMemberResponse upsertFarmMember(Long farmId, com.farm.saas.modules.auth.dto.request.FarmMemberRequest request);
    void removeFarmMember(Long farmId, Long userId);
}
