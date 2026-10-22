package com.farm.saas.modules.auth.service;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.dto.request.CreateUserRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserRolesRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserStatusRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import com.farm.saas.modules.auth.dto.response.UserDetailResponse;
import com.farm.saas.modules.auth.dto.response.UserInfoDto;
import com.farm.saas.modules.auth.entity.Permission;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.RolePermission;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.PermissionRepository;
import com.farm.saas.modules.auth.repository.RefreshTokenRepository;
import com.farm.saas.modules.auth.repository.RolePermissionRepository;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.FarmAssignment;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.FarmAssignmentRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.UserFarmAccessRepository;
import com.farm.saas.modules.platform.entity.TenantSubscription;
import com.farm.saas.modules.platform.repository.TenantSubscriptionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final FarmRepository farmRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDetailResponse> getUsers(String status, Long roleId, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.toUpperCase()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> usersPage = userRepository.findAll(spec, pageable);
        List<UserDetailResponse> responses = usersPage.getContent().stream()
                .map(this::enrichUserDetail)
                .collect(Collectors.toList());

        if (roleId != null) {
            responses = responses.stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r -> Objects.equals(r.getId(), roleId)))
                    .collect(Collectors.toList());
        }

        return new PageImpl<>(responses, pageable, usersPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Long id) {
        User user = findUserAndCheckTenant(id);
        return enrichUserDetail(user);
    }

    @Override
    @Transactional
    public UserDetailResponse createUser(CreateUserRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        // Chốt chặn Hạn mức Gói thuê bao: Kiểm tra số lượng user của tenant < tenant_subscriptions.max_users
        if (tenantId != null) {
            TenantSubscription activeSub = tenantSubscriptionRepository
                    .findByTenantIdAndIsActiveTrue(tenantId)
                    .orElse(null);

            if (activeSub != null) {
                long currentUserCount = userRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");
                if (currentUserCount >= activeSub.getMaxUsers()) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "SUBSCRIPTION_USER_LIMIT_EXCEEDED",
                            String.format("Số lượng người dùng đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!",
                                    currentUserCount, activeSub.getMaxUsers()));
                }
            }
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại trên hệ thống.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Địa chỉ email đã tồn tại trên hệ thống.");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone())) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS", "Số điện thoại đã tồn tại trên hệ thống.");
        }

        // Chặn leo thang đặc quyền: User thuộc Tenant không bao giờ được gán ROLE_SUPER_ADMIN
        List<Role> selectedRoles = roleRepository.findAllById(request.getRoleIds());
        for (Role role : selectedRoles) {
            if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role.getCode())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "PRIVILEGE_ESCALATION_DENIED", "Không thể gán quyền Super Admin cho tài khoản thuộc khách thuê.");
            }
        }

        // Kiểm tra vai trò cấp FARM bắt buộc có farmId
        boolean hasFarmLevelRole = selectedRoles.stream().anyMatch(r -> "FARM".equalsIgnoreCase(r.getScopeLevel()));
        if (hasFarmLevelRole && (request.getAssignedFarmIds() == null || request.getAssignedFarmIds().isEmpty())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FARM_SCOPE_REQUIRED", "Vai trò cấp nông trại yêu cầu chỉ định ít nhất một trang trại phân công.");
        }

        User newUser = User.builder()
                .tenantId(tenantId)
                .username(request.getUsername())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isSuperAdmin(false)
                .status("ACTIVE")
                .mustChangePassword(true)
                .failedLogins(0)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        User savedUser = userRepository.save(newUser);

        // Đồng bộ 2 bảng: user_roles (#8) & user_farm_access (#12) trong cùng @Transactional
        assignRolesAndFarmAccess(savedUser, selectedRoles, request.getAssignedFarmIds());

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_USER")
                .module("USERS")
                .endpoint("/api/v1/users")
                .method("POST")
                .newValue(savedUser.getUsername())
                .build());

        return enrichUserDetail(savedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserRoles(Long id, UpdateUserRolesRequest request) {
        User user = findUserAndCheckTenant(id);

        List<Role> selectedRoles = roleRepository.findAllById(request.getRoleIds());
        for (Role role : selectedRoles) {
            if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role.getCode()) && !Boolean.TRUE.equals(user.getIsSuperAdmin())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "PRIVILEGE_ESCALATION_DENIED", "Không thể gán quyền Super Admin.");
            }
        }

        boolean hasFarmLevelRole = selectedRoles.stream().anyMatch(r -> "FARM".equalsIgnoreCase(r.getScopeLevel()));
        if (hasFarmLevelRole && (request.getAssignedFarmIds() == null || request.getAssignedFarmIds().isEmpty())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FARM_SCOPE_REQUIRED", "Vai trò cấp nông trại yêu cầu chỉ định ít nhất một trang trại phân công.");
        }

        // Xóa cấu hình cũ và đồng bộ lại 2 bảng
        userRoleRepository.deleteByUserId(user.getId());
        userFarmAccessRepository.deleteByUserId(user.getId());

        assignRolesAndFarmAccess(user, selectedRoles, request.getAssignedFarmIds());

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_ROLES")
                .module("USERS")
                .endpoint("/api/v1/users/" + id + "/roles")
                .method("PUT")
                .newValue(request.getRoleIds().toString())
                .build());

        return enrichUserDetail(user);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = findUserAndCheckTenant(id);
        String oldStatus = user.getStatus();
        String newStatus = request.getStatus().toUpperCase();

        user.setStatus(newStatus);
        user.setUpdatedAt(Instant.now());
        user.setUpdatedBy(SecurityUtils.getCurrentUserId());
        userRepository.save(user);

        if ("INACTIVE".equalsIgnoreCase(newStatus) || "LOCKED".equalsIgnoreCase(newStatus)) {
            refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_STATUS")
                .module("USERS")
                .endpoint("/api/v1/users/" + id + "/status")
                .method("PUT")
                .oldValue(oldStatus)
                .newValue(newStatus)
                .build());

        return enrichUserDetail(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleMatrixResponse> getSystemRoles() {
        List<Role> roles = roleRepository.findAll();
        List<RoleMatrixResponse> responses = new ArrayList<>();

        for (Role role : roles) {
            List<RolePermission> rps = rolePermissionRepository.findByRoleId(role.getId());
            List<Long> permIds = rps.stream().map(RolePermission::getPermissionId).toList();
            List<Permission> permissions = permissionRepository.findAllById(permIds);

            List<RoleMatrixResponse.PermissionDto> permDtos = permissions.stream()
                    .map(p -> RoleMatrixResponse.PermissionDto.builder()
                            .id(p.getId())
                            .code(p.getCode())
                            .name(p.getDescription() != null ? p.getDescription() : p.getCode())
                            .module(p.getModule())
                            .description(p.getDescription())
                            .build())
                    .toList();

            responses.add(RoleMatrixResponse.builder()
                    .id(role.getId())
                    .code(role.getCode())
                    .name(role.getName())
                    .scopeLevel(role.getScopeLevel())
                    .description(role.getDescription())
                    .permissions(permDtos)
                    .build());
        }

        return responses;
    }

    private void assignRolesAndFarmAccess(User user, List<Role> roles, List<Long> farmIds) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        for (Role role : roles) {
            if ("FARM".equalsIgnoreCase(role.getScopeLevel()) && farmIds != null && !farmIds.isEmpty()) {
                for (Long farmId : farmIds) {
                    UserRole userRole = UserRole.builder()
                            .tenantId(user.getTenantId())
                            .userId(user.getId())
                            .roleId(role.getId())
                            .farmId(farmId)
                            .assignedAt(Instant.now())
                            .assignedBy(currentUserId)
                            .build();
                    userRoleRepository.save(userRole);
                }
            } else {
                UserRole userRole = UserRole.builder()
                        .tenantId(user.getTenantId())
                        .userId(user.getId())
                        .roleId(role.getId())
                        .farmId(null)
                        .assignedAt(Instant.now())
                        .assignedBy(currentUserId)
                        .build();
                userRoleRepository.save(userRole);
            }
        }

        if (farmIds != null && !farmIds.isEmpty()) {
            for (Long farmId : farmIds) {
                if (!userFarmAccessRepository.existsByUserIdAndFarmId(user.getId(), farmId)) {
                    UserFarmAccess access = UserFarmAccess.builder()
                            .userId(user.getId())
                            .farmId(farmId)
                            .tenantId(user.getTenantId())
                            .grantedAt(Instant.now())
                            .grantedBy(currentUserId)
                            .build();
                    userFarmAccessRepository.save(access);
                }
            }
        }
    }

    private User findUserAndCheckTenant(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng."));

        Long currentTenantId = SecurityUtils.getCurrentTenantId();
        if (currentTenantId != null && !SecurityUtils.isSuperAdmin()) {
            if (!Objects.equals(user.getTenantId(), currentTenantId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền truy cập người dùng thuộc khách thuê khác.");
            }
        }
        return user;
    }

    private UserDetailResponse enrichUserDetail(User user) {
        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        Set<Long> roleIds = userRoles.stream().map(UserRole::getRoleId).collect(Collectors.toSet());
        List<Role> roles = roleRepository.findAllById(roleIds);

        List<UserInfoDto.RoleDto> roleDtos = roles.stream()
                .map(r -> UserInfoDto.RoleDto.builder()
                        .id(r.getId())
                        .code(r.getCode())
                        .name(r.getName())
                        .scopeLevel(r.getScopeLevel())
                        .build())
                .toList();

        boolean isSuperAdmin = Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getCode()));
        boolean isOwnerTenantScope = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()) && "TENANT".equalsIgnoreCase(r.getScopeLevel()));
        boolean hasOwnerRole = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()));
        boolean hasAccountantRole = roles.stream().anyMatch(r -> "ROLE_ACCOUNTANT".equals(r.getCode()));
        boolean hasTechRole = roles.stream().anyMatch(r -> "ROLE_TECHNICAL_STAFF".equals(r.getCode()));
        boolean hasWarehouseRole = roles.stream().anyMatch(r -> "ROLE_WAREHOUSE_STAFF".equals(r.getCode()));
        boolean hasFieldStaffRole = roles.stream().anyMatch(r -> "ROLE_FIELD_STAFF".equals(r.getCode()));

        List<FarmAssignment> activeAssignments = farmAssignmentRepository.findByUserIdAndIsActiveTrue(user.getId());
        List<UserInfoDto.FarmAssignmentDto> assignmentDtos = activeAssignments.stream().map(a -> {
            String fName = farmRepository.findById(a.getFarmId()).map(Farm::getName).orElse(null);
            return UserInfoDto.FarmAssignmentDto.builder()
                    .id(a.getId())
                    .farmId(a.getFarmId())
                    .farmName(fName)
                    .zoneId(a.getZoneId())
                    .roleInFarm(a.getRoleInFarm())
                    .isActive(a.getIsActive())
                    .build();
        }).toList();

        Set<Long> accessibleFarmIds = new LinkedHashSet<>();
        List<UserFarmAccess> accesses = userFarmAccessRepository.findByUserId(user.getId());
        for (UserFarmAccess access : accesses) {
            accessibleFarmIds.add(access.getFarmId());
        }

        List<Farm> managedFarms = farmRepository.findByManagerUserId(user.getId());
        for (Farm mf : managedFarms) {
            accessibleFarmIds.add(mf.getId());
        }

        for (FarmAssignment fa : activeAssignments) {
            accessibleFarmIds.add(fa.getFarmId());
        }

        if ((isSuperAdmin || isOwnerTenantScope) && user.getTenantId() != null) {
            List<Farm> allTenantFarms = farmRepository.findByTenantId(user.getTenantId());
            for (Farm tf : allTenantFarms) {
                accessibleFarmIds.add(tf.getId());
            }
        }

        List<UserInfoDto.AccessibleFarmDto> farmDtos = new ArrayList<>();
        boolean isDirectFarmManager = !managedFarms.isEmpty() || activeAssignments.stream().anyMatch(a -> "FARM_MANAGER".equalsIgnoreCase(a.getRoleInFarm()));

        for (Long farmId : accessibleFarmIds) {
            Optional<Farm> farmOpt = farmRepository.findById(farmId);
            if (farmOpt.isPresent()) {
                Farm farm = farmOpt.get();
                if ("DELETED".equalsIgnoreCase(farm.getStatus())) {
                    continue;
                }

                boolean isManagerOfThisFarm = farm.getManagerUserId() != null && farm.getManagerUserId().equals(user.getId());
                Optional<FarmAssignment> farmSpecificAssignment = activeAssignments.stream()
                        .filter(a -> a.getFarmId().equals(farm.getId()))
                        .findFirst();

                if (farmSpecificAssignment.isPresent() && "FARM_MANAGER".equalsIgnoreCase(farmSpecificAssignment.get().getRoleInFarm())) {
                    isManagerOfThisFarm = true;
                }

                String assignedRole = "MEMBER";
                if (isManagerOfThisFarm) {
                    assignedRole = "FARM_MANAGER";
                } else if (farmSpecificAssignment.isPresent()) {
                    assignedRole = farmSpecificAssignment.get().getRoleInFarm();
                } else if (isOwnerTenantScope) {
                    assignedRole = "FARM_OWNER";
                } else if (hasAccountantRole) {
                    assignedRole = "ACCOUNTANT";
                } else if (hasTechRole) {
                    assignedRole = "TECHNICAL_LEAD";
                } else if (hasWarehouseRole) {
                    assignedRole = "WAREHOUSE_KEEPER";
                } else if (hasFieldStaffRole) {
                    assignedRole = "FIELD_WORKER";
                }

                farmDtos.add(UserInfoDto.AccessibleFarmDto.builder()
                        .farmId(farm.getId())
                        .farmCode(farm.getCode())
                        .farmName(farm.getName())
                        .farmType(farm.getFarmType())
                        .assignedRole(assignedRole)
                        .isManager(isManagerOfThisFarm || isOwnerTenantScope)
                        .managerUserId(farm.getManagerUserId())
                        .build());
            }
        }

        String operationalRole = "STAFF";
        if (isSuperAdmin) {
            operationalRole = "SUPER_ADMIN";
        } else if (isOwnerTenantScope || (hasOwnerRole && !isDirectFarmManager && farmDtos.size() > 1)) {
            operationalRole = "OWNER";
        } else if (isDirectFarmManager || (hasOwnerRole && !isOwnerTenantScope)) {
            operationalRole = "FARM_MANAGER";
        } else if (hasAccountantRole) {
            operationalRole = "FARM_ACCOUNTANT";
        } else if (hasTechRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("ZONE_MANAGER", "TECHNICAL_LEAD", "AGRONOMIST", "VETERINARIAN").contains(a.getRoleInFarm()))) {
            operationalRole = "TECHNICAL_LEAD";
        } else if (hasWarehouseRole || activeAssignments.stream().anyMatch(a -> "WAREHOUSE_KEEPER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "WAREHOUSE_KEEPER";
        } else if (hasFieldStaffRole || activeAssignments.stream().anyMatch(a -> "FIELD_WORKER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "FIELD_WORKER";
        }

        return UserDetailResponse.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(user.getStatus())
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .roles(roleDtos)
                .accessibleFarms(farmDtos)
                .farmAssignments(assignmentDtos)
                .operationalRole(operationalRole)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
