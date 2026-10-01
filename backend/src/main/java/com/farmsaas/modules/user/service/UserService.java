package com.farmsaas.modules.user.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.user.dto.CreateUserRequest;
import com.farmsaas.modules.user.dto.UpdateUserStatusRequest;
import com.farmsaas.modules.user.dto.UserResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {

    PageResponse<UserResponse> getUsers(Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);
}
