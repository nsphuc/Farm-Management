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
    UserDetailResponse getUserById(Long id);
    UserDetailResponse createUser(CreateUserRequest request);
    UserDetailResponse updateUserRoles(Long id, UpdateUserRolesRequest request);
    UserDetailResponse updateUserStatus(Long id, UpdateUserStatusRequest request);
    List<RoleMatrixResponse> getSystemRoles();
}
