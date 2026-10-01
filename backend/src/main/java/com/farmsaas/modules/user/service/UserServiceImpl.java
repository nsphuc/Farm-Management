package com.farmsaas.modules.user.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.common.exception.TenantAccessDeniedException;
import com.farmsaas.modules.user.dto.CreateUserRequest;
import com.farmsaas.modules.user.dto.UpdateUserStatusRequest;
import com.farmsaas.modules.user.dto.UserResponse;
import com.farmsaas.modules.user.entity.Role;
import com.farmsaas.modules.user.entity.User;
import com.farmsaas.modules.user.repository.RoleRepository;
import com.farmsaas.modules.user.repository.UserRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private Long getCurrentTenantId() {
        Long tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new TenantAccessDeniedException("Yêu cầu không xác định được Tenant ID.");
        }
        return tenantId;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(Pageable pageable) {
        Long tenantId = getCurrentTenantId();
        Page<User> usersPage = userRepository.findByTenantId(tenantId, pageable);

        List<UserResponse> responses = usersPage.getContent().stream()
                .map(UserResponse::fromEntity)
                .toList();

        return PageResponse.of(usersPage, responses);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        Long tenantId = getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        Long tenantId = getCurrentTenantId();

        if (userRepository.existsByUsernameAndTenantId(request.getUsername(), tenantId)) {
            throw new BusinessException(
                    "USERNAME_EXISTS",
                    "Tên đăng nhập '" + request.getUsername() + "' đã tồn tại trong doanh nghiệp.",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
            throw new BusinessException(
                    "EMAIL_EXISTS",
                    "Email '" + request.getEmail() + "' đã tồn tại trong doanh nghiệp.",
                    HttpStatus.BAD_REQUEST
            );
        }

        List<Role> roles = roleRepository.findByCodeIn(request.getRoleCodes());
        if (roles.isEmpty()) {
            throw new BusinessException(
                    "INVALID_ROLES",
                    "Các vai trò được chỉ định không hợp lệ.",
                    HttpStatus.BAD_REQUEST
            );
        }

        User user = new User();
        user.setTenantId(tenantId);
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setStatus("ACTIVE");
        user.setRoles(new HashSet<>(roles));

        User savedUser = userRepository.save(user);
        log.info("Đã tạo User mới '{}' [ID: {}] trong Tenant: {}", savedUser.getUsername(), savedUser.getId(), tenantId);

        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        Long tenantId = getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        String newStatus = request.getStatus().toUpperCase();
        user.setStatus(newStatus);
        
        // Nếu mở khóa thủ công, reset số lần đăng nhập sai
        if ("ACTIVE".equals(newStatus)) {
            user.setFailedLogins(0);
            user.setLockUntil(null);
        }

        User updatedUser = userRepository.save(user);
        log.info("Đã cập nhật trạng thái User ID {} thành '{}' trong Tenant: {}", id, newStatus, tenantId);

        return UserResponse.fromEntity(updatedUser);
    }
}
