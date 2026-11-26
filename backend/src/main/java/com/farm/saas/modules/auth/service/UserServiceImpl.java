package com.farm.saas.modules.auth.service;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.common.mail.EmailService;
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
import com.farm.saas.modules.workforce.repository.EmployeeRepository;
import com.farm.saas.modules.workforce.entity.Employee;
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
    private final EmployeeRepository employeeRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final com.farm.saas.modules.platform.repository.TenantRepository tenantRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final com.farm.saas.common.security.FarmSecurityEvaluator farmSecurity;
    private final EmailService emailService;
    private final com.farm.saas.modules.auth.repository.FarmMemberRepository farmMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDetailResponse> getUsers(String status, Long roleId, String keyword, Pageable pageable) {
        return getUsers(null, status, roleId, keyword, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDetailResponse> getUsers(Long tenantId, String status, Long roleId, String keyword, Pageable pageable) {
        Long currentTenantId = SecurityUtils.getCurrentTenantId();
        Long filterTenantId = null;
        if (SecurityUtils.isSuperAdmin()) {
            filterTenantId = tenantId; // null = all tenants, or specific tenant
        } else {
            filterTenantId = currentTenantId;
        }

        final Long effectiveTenantFilter = filterTenantId;
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (effectiveTenantFilter != null) {
                predicates.add(cb.equal(root.get("tenantId"), effectiveTenantFilter));
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
        Long effectiveTenantId = SecurityUtils.getCurrentTenantId();
        if (SecurityUtils.isSuperAdmin() && request.getTenantId() != null) {
            effectiveTenantId = request.getTenantId();
        }

        if (effectiveTenantId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT",
                    "Super Admin phải chọn Doanh nghiệp thuê bao (tenantId) khi khởi tạo tài khoản.");
        }

        // Chốt chặn Hạn mức Gói thuê bao: Kiểm tra số lượng user của tenant < tenant_subscriptions.max_users
        TenantSubscription activeSub = tenantSubscriptionRepository
                .findByTenantIdAndIsActiveTrue(effectiveTenantId)
                .orElse(null);

        if (activeSub != null) {
            long currentUserCount = userRepository.countByTenantIdAndStatusNot(effectiveTenantId, "DELETED");
            if (currentUserCount >= activeSub.getMaxUsers()) {
                throw new ApiException(HttpStatus.FORBIDDEN, "SUBSCRIPTION_USER_LIMIT_EXCEEDED",
                        String.format("Số lượng người dùng đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!",
                                currentUserCount, activeSub.getMaxUsers()));
            }
        }

        if (request.getEmail() != null && !request.getEmail().trim().toLowerCase().endsWith("@gmail.com")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL_DOMAIN", "Email bắt buộc phải có định dạng @gmail.com (ví dụ: example@gmail.com).");
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

        // Chặn leo thang đặc quyền & kiểm tra phân cấp ủy quyền (Maker - Checker & 4-Tier)
        List<Role> selectedRoles = new ArrayList<>();
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            selectedRoles = roleRepository.findAllById(request.getRoleIds());
        } else if (SecurityUtils.isSuperAdmin()) {
            Role ownerRole = roleRepository.findByCode("ROLE_FARM_OWNER")
                    .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_NOT_FOUND", "Không tìm thấy vai trò ROLE_FARM_OWNER"));
            selectedRoles.add(ownerRole);
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROLE_REQUIRED", "Phải gán ít nhất 1 vai trò.");
        }
        for (Role role : selectedRoles) {
            if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role.getCode())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "PRIVILEGE_ESCALATION_DENIED", "Không thể gán quyền Super Admin cho tài khoản thuộc khách thuê.");
            }
            if (request.getAssignedFarmIds() != null && !request.getAssignedFarmIds().isEmpty()) {
                for (Long farmId : request.getAssignedFarmIds()) {
                    farmSecurity.canAssignRole(role.getCode(), farmId);
                }
            } else {
                farmSecurity.canAssignRole(role.getCode(), null);
            }
        }

        // Kiểm tra vai trò cấp FARM bắt buộc có farmId
        boolean hasFarmLevelRole = selectedRoles.stream().anyMatch(r -> "FARM".equalsIgnoreCase(r.getScopeLevel()));
        if (hasFarmLevelRole && (request.getAssignedFarmIds() == null || request.getAssignedFarmIds().isEmpty())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FARM_SCOPE_REQUIRED", "Vai trò cấp nông trại yêu cầu chỉ định ít nhất một trang trại phân công.");
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim()
                : "Farm@123456";

        User newUser = User.builder()
                .tenantId(effectiveTenantId)
                .username(request.getUsername())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
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
                .tenantId(effectiveTenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_USER")
                .module("USERS")
                .endpoint("/api/v1/users")
                .method("POST")
                .newValue(savedUser.getUsername())
                .build());

        // Tự động tạo hồ sơ Employee khi người dùng vừa được tạo trên Web
        // để tài khoản có thể vào WS-G chấm công GPS và nhận việc ngay mà không bị lỗi thiếu hồ sơ.
        autoCreateEmployeeProfile(savedUser, effectiveTenantId, selectedRoles, request);

        // Tự động gửi email chứa thông tin tài khoản và mật khẩu tới người dùng (Nhiệm vụ 5)
        if (savedUser.getEmail() != null && !savedUser.getEmail().isBlank()) {
            emailService.sendAccountCredentialsEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getUsername(),
                    rawPassword,
                    null
            );
        }

        return enrichUserDetail(savedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserRoles(Long id, UpdateUserRolesRequest request) {
        User user = findUserAndCheckTenant(id);

        com.farm.saas.common.security.CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && currentUser.hasRole("ROLE_FARM_MANAGER") && !currentUser.hasAnyRole("ROLE_FARM_OWNER", "ROLE_SUPER_ADMIN")) {
            int targetTier = getUserTierLevel(user);
            if (targetTier < 4) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_TIER_MANAGE", "Giám đốc trang trại chỉ có quyền quản lý và phân vai trò cho nhân sự Cấp 4.");
            }
            if (!isUserInCallerFarms(user, currentUser.getAccessibleFarmIds())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_FARM_MANAGE", "Nhân viên không thuộc trang trại do bạn quản lý.");
            }
        }

        List<Role> selectedRoles = new java.util.ArrayList<>();
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            selectedRoles.addAll(roleRepository.findAllById(request.getRoleIds()));
        }
        if (request.getRoleCodes() != null && !request.getRoleCodes().isEmpty()) {
            for (String code : request.getRoleCodes()) {
                roleRepository.findByCode(code).ifPresent(r -> {
                    if (!selectedRoles.contains(r)) selectedRoles.add(r);
                });
            }
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String code : request.getRoles()) {
                roleRepository.findByCode(code).ifPresent(r -> {
                    if (!selectedRoles.contains(r)) selectedRoles.add(r);
                });
            }
        }

        if (selectedRoles.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROLE_REQUIRED", "Phải chỉ định ít nhất 1 vai trò hợp lệ.");
        }

        List<Long> assignedFarmIds = request.getAssignedFarmIds() != null ? new java.util.ArrayList<>(request.getAssignedFarmIds()) : new java.util.ArrayList<>();
        if (assignedFarmIds.isEmpty()) {
            employeeRepository.findByUserId(user.getId()).ifPresent(emp -> {
                if (emp.getFarmId() != null) {
                    assignedFarmIds.add(emp.getFarmId());
                }
            });
        }

        Set<String> allowedTier4Roles = Set.of("ROLE_TECHNICAL_STAFF", "ROLE_ACCOUNTANT", "ROLE_FIELD_STAFF");

        for (Role role : selectedRoles) {
            if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role.getCode()) && !Boolean.TRUE.equals(user.getIsSuperAdmin())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "PRIVILEGE_ESCALATION_DENIED", "Không thể gán quyền Super Admin.");
            }
            if (currentUser != null && currentUser.hasRole("ROLE_FARM_MANAGER") && !currentUser.hasAnyRole("ROLE_FARM_OWNER", "ROLE_SUPER_ADMIN")) {
                if (!allowedTier4Roles.contains(role.getCode())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE_ASSIGN", "Giám đốc trang trại chỉ được phép gán các vai trò Cấp 4 (Kỹ thuật, Kho, Kế toán, Hiện trường).");
                }
            }
            if (!assignedFarmIds.isEmpty()) {
                for (Long farmId : assignedFarmIds) {
                    farmSecurity.canAssignRole(role.getCode(), farmId);
                }
            } else {
                farmSecurity.canAssignRole(role.getCode(), null);
            }
        }

        boolean hasFarmLevelRole = selectedRoles.stream().anyMatch(r -> "FARM".equalsIgnoreCase(r.getScopeLevel()));
        if (hasFarmLevelRole && assignedFarmIds.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FARM_SCOPE_REQUIRED", "Vai trò cấp nông trại yêu cầu chỉ định ít nhất một trang trại phân công.");
        }

        // Xóa cấu hình cũ và đồng bộ lại 2 bảng
        userRoleRepository.deleteByUserId(user.getId());
        userFarmAccessRepository.deleteByUserId(user.getId());

        assignRolesAndFarmAccess(user, selectedRoles, assignedFarmIds);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_ROLES")
                .module("USERS")
                .endpoint("/api/v1/users/" + id + "/roles")
                .method("PUT")
                .newValue(selectedRoles.stream().map(Role::getCode).toList().toString())
                .build());

        return enrichUserDetail(user);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = findUserAndCheckTenant(id);

        com.farm.saas.common.security.CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && currentUser.hasRole("ROLE_FARM_MANAGER") && !currentUser.hasAnyRole("ROLE_FARM_OWNER", "ROLE_SUPER_ADMIN")) {
            int targetTier = getUserTierLevel(user);
            if (targetTier < 4) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_TIER_MANAGE", "Giám đốc trang trại chỉ có quyền quản lý trạng thái tài khoản nhân sự Cấp 4.");
            }
            if (!isUserInCallerFarms(user, currentUser.getAccessibleFarmIds())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_FARM_MANAGE", "Nhân viên không thuộc trang trại do bạn quản lý.");
            }
        }

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
                    .farmId(role.getFarmId())
                    .isSystem(Boolean.TRUE.equals(role.getIsSystem()))
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

                for (Role role : roles) {
                    if ("ROLE_FARM_MANAGER".equalsIgnoreCase(role.getCode())) {
                        farmRepository.findById(farmId).ifPresent(f -> {
                            f.setManagerUserId(user.getId());
                            f.setUpdatedAt(Instant.now());
                            f.setUpdatedBy(currentUserId);
                            farmRepository.save(f);
                        });
                        boolean hasAssignment = farmAssignmentRepository.findByUserIdAndIsActiveTrue(user.getId())
                                .stream().anyMatch(a -> a.getFarmId().equals(farmId) && "FARM_MANAGER".equalsIgnoreCase(a.getRoleInFarm()));
                        if (!hasAssignment) {
                            farmAssignmentRepository.save(FarmAssignment.builder()
                                    .tenantId(user.getTenantId())
                                    .farmId(farmId)
                                    .userId(user.getId())
                                    .roleInFarm("FARM_MANAGER")
                                    .assignedFrom(java.time.LocalDate.now())
                                    .isActive(true)
                                    .createdAt(Instant.now())
                                    .createdBy(currentUserId)
                                    .build());
                        }
                    } else if ("ROLE_TECHNICAL_STAFF".equalsIgnoreCase(role.getCode())
                            || "ROLE_ACCOUNTANT".equalsIgnoreCase(role.getCode())
                            || "ROLE_FIELD_STAFF".equalsIgnoreCase(role.getCode())) {
                        String mappedRoleInFarm;
                        if ("ROLE_TECHNICAL_STAFF".equalsIgnoreCase(role.getCode())) {
                            mappedRoleInFarm = "TECHNICAL_LEAD";
                        } else if ("ROLE_ACCOUNTANT".equalsIgnoreCase(role.getCode())) {
                            mappedRoleInFarm = "ACCOUNTANT";
                        } else {
                            mappedRoleInFarm = "FIELD_WORKER";
                        }
                        List<FarmAssignment> existingAssignments = farmAssignmentRepository.findByUserIdAndIsActiveTrue(user.getId())
                                .stream().filter(a -> a.getFarmId().equals(farmId)).toList();
                        if (!existingAssignments.isEmpty()) {
                            for (FarmAssignment fa : existingAssignments) {
                                fa.setRoleInFarm(mappedRoleInFarm);
                                fa.setUpdatedAt(Instant.now());
                                fa.setUpdatedBy(currentUserId);
                                farmAssignmentRepository.save(fa);
                            }
                        } else {
                            farmAssignmentRepository.save(FarmAssignment.builder()
                                    .tenantId(user.getTenantId())
                                    .farmId(farmId)
                                    .userId(user.getId())
                                    .roleInFarm(mappedRoleInFarm)
                                    .assignedFrom(java.time.LocalDate.now())
                                    .isActive(true)
                                    .createdAt(Instant.now())
                                    .createdBy(currentUserId)
                                    .build());
                        }
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public Map<String, Object> resetPassword(Long id, com.farm.saas.modules.auth.dto.request.ResetPasswordRequest request) {
        User user = findUserAndCheckTenant(id);
        com.farm.saas.common.security.CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && currentUser.hasRole("ROLE_FARM_MANAGER") && !currentUser.hasAnyRole("ROLE_FARM_OWNER", "ROLE_SUPER_ADMIN")) {
            int targetTier = getUserTierLevel(user);
            if (targetTier < 4) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_TIER_MANAGE", "Giám đốc trang trại chỉ có quyền đặt lại mật khẩu cho nhân sự Cấp 4.");
            }
            if (!isUserInCallerFarms(user, currentUser.getAccessibleFarmIds())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_FARM_MANAGE", "Nhân viên không thuộc trang trại do bạn quản lý.");
            }
        } else if (currentUser != null && currentUser.hasRole("ROLE_FARM_OWNER") && !currentUser.isSuperAdmin()) {
            int targetTier = getUserTierLevel(user);
            if (targetTier < 3) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN_TIER_MANAGE", "Chủ trang trại chỉ có quyền đặt lại mật khẩu cho Giám đốc trang trại và nhân sự Cấp 4.");
            }
        }

        String tempPassword = (request != null && request.getNewPassword() != null && !request.getNewPassword().isBlank())
                ? request.getNewPassword().trim()
                : "Farm@123456";

        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        user.setFailedLogins(0);
        user.setLockUntil(null);
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        user.setUpdatedAt(Instant.now());
        user.setUpdatedBy(currentUser != null ? currentUser.getId() : null);
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(currentUser != null ? currentUser.getId() : null)
                .action("RESET_PASSWORD")
                .module("USERS")
                .endpoint("/api/v1/users/" + id + "/reset-password")
                .method("POST")
                .newValue("Reset password for user " + user.getUsername())
                .build());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đặt lại mật khẩu thành công. Nhân viên phải đổi mật khẩu ở lần đăng nhập tiếp theo.");
        result.put("tempPassword", tempPassword);
        result.put("mustChangePassword", true);
        return result;
    }

    /**
     * Tự động tạo hồ sơ Employee cho user vừa được tạo trên Web UI
     * để tài khoản có thể vào WS-G chấm công GPS, nhận việc ngay mà không bao giờ bị lỗi thiếu hồ sơ.
     * Bỏ qua nếu user đã có hồ sơ Employee hoặc là FARM_OWNER / FARM_MANAGER (đặc thù không cần hồ sơ nhân công).
     */
    private void autoCreateEmployeeProfile(User user, Long tenantId, List<Role> roles, CreateUserRequest request) {
        try {
            // Chỉ tạo cho các vai trò cấp 4 (nhân sự vận hành), không tạo cho OWNER / MANAGER
            boolean hasFarmLevelRole = roles.stream().anyMatch(r -> r.getScopeLevel() != null &&
                    "FARM".equalsIgnoreCase(r.getScopeLevel()) &&
                    !"ROLE_FARM_OWNER".equalsIgnoreCase(r.getCode()) &&
                    !"ROLE_FARM_MANAGER".equalsIgnoreCase(r.getCode()));
            if (!hasFarmLevelRole) {
                return;
            }

            // Kiểm tra đã có hồ sơ Employee chưa
            boolean alreadyExists = employeeRepository.findByTenantIdAndUserId(tenantId, user.getId()).isPresent();
            if (alreadyExists) {
                return;
            }

            // Xác định farmId đầu tiên được cấp quyền
            Long farmId = null;
            if (request.getAssignedFarmIds() != null && !request.getAssignedFarmIds().isEmpty()) {
                farmId = request.getAssignedFarmIds().get(0);
            }
            if (farmId == null) {
                // Fallback: lấy farm đầu tiên của tenant
                List<com.farm.saas.modules.geography.entity.Farm> tenantFarms = farmRepository.findByTenantId(tenantId);
                if (!tenantFarms.isEmpty()) {
                    tenantFarms.sort(java.util.Comparator.comparing(f -> f.getId()));
                    farmId = tenantFarms.get(0).getId();
                }
            }

            // Sinh employeeCode duy nhất
            String baseCode = "EMP-" + user.getId();
            String employeeCode = baseCode;
            if (employeeRepository.findByTenantIdAndEmployeeCode(tenantId, employeeCode).isPresent()) {
                employeeCode = baseCode + "-" + (System.currentTimeMillis() % 10000);
            }

            String fullName = (user.getFullName() != null && !user.getFullName().isBlank())
                    ? user.getFullName() : user.getUsername();

            Employee employee = Employee.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .userId(user.getId())
                    .employeeCode(employeeCode)
                    .fullName(fullName)
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .joinedDate(java.time.LocalDate.now())
                    .baseSalary(java.math.BigDecimal.ZERO)
                    .hourlyRate(java.math.BigDecimal.ZERO)
                    .contractType("FULL_TIME")
                    .annualLeaveQuota(new java.math.BigDecimal("12.0"))
                    .status("ACTIVE")
                    .createdAt(java.time.Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();

            employeeRepository.save(employee);
            log.info("Tự động tạo hồ sơ Employee cho user: id={}, username={}, employeeCode={}, farmId={}",
                    user.getId(), user.getUsername(), employeeCode, farmId);
        } catch (Exception ex) {
            log.warn("Không thể tự động tạo hồ sơ Employee cho userId {}: {}", user.getId(), ex.getMessage());
        }
    }

    private int getUserTierLevel(User user) {
        if (Boolean.TRUE.equals(user.getIsSuperAdmin())) {
            return 1;
        }
        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        List<Long> roleIds = userRoles.stream().map(UserRole::getRoleId).toList();
        List<Role> roles = roleRepository.findAllById(roleIds);
        if (roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(r.getCode()))) {
            return 1;
        }
        if (roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equalsIgnoreCase(r.getCode()))) {
            return 2;
        }
        if (roles.stream().anyMatch(r -> "ROLE_FARM_MANAGER".equalsIgnoreCase(r.getCode()))) {
            return 3;
        }
        return 4;
    }

    private boolean isUserInCallerFarms(User user, Set<Long> callerFarmIds) {
        if (callerFarmIds == null || callerFarmIds.isEmpty()) {
            return false;
        }
        List<UserFarmAccess> accesses = userFarmAccessRepository.findByUserId(user.getId());
        if (accesses.stream().anyMatch(a -> callerFarmIds.contains(a.getFarmId()))) {
            return true;
        }
        List<FarmAssignment> assignments = farmAssignmentRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (assignments.stream().anyMatch(a -> callerFarmIds.contains(a.getFarmId()))) {
            return true;
        }
        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        if (userRoles.stream().anyMatch(ur -> ur.getFarmId() != null && callerFarmIds.contains(ur.getFarmId()))) {
            return true;
        }
        return employeeRepository.findByUserId(user.getId())
                .map(emp -> emp.getFarmId() != null && callerFarmIds.contains(emp.getFarmId()))
                .orElse(false);
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

        Map<Long, Role> roleMap = roles.stream().collect(Collectors.toMap(Role::getId, r -> r));
        List<UserInfoDto.RoleDto> roleDtos = userRoles.stream()
                .filter(ur -> roleMap.containsKey(ur.getRoleId()))
                .map(ur -> {
                    Role r = roleMap.get(ur.getRoleId());
                    return UserInfoDto.RoleDto.builder()
                            .id(r.getId())
                            .code(r.getCode())
                            .name(r.getName())
                            .scopeLevel(r.getScopeLevel())
                            .assignedFarmId(ur.getFarmId())
                            .build();
                })
                .toList();

        boolean isSuperAdmin = Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getCode()));
        boolean isOwnerTenantScope = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()) && "TENANT".equalsIgnoreCase(r.getScopeLevel()));
        boolean hasOwnerRole = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()));
        boolean hasAccountantRole = roles.stream().anyMatch(r -> "ROLE_ACCOUNTANT".equals(r.getCode()));
        boolean hasTechRole = roles.stream().anyMatch(r -> "ROLE_TECHNICAL_STAFF".equals(r.getCode()));
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
        } else if (hasAccountantRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("FARM_ACCOUNTANT", "ACCOUNTANT", "WAREHOUSE_KEEPER").contains(a.getRoleInFarm()))) {
            operationalRole = "FARM_ACCOUNTANT";
        } else if (hasTechRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("ZONE_MANAGER", "TECHNICAL_LEAD", "AGRONOMIST", "VETERINARIAN").contains(a.getRoleInFarm()))) {
            operationalRole = "TECHNICAL_LEAD";
        } else if (hasFieldStaffRole || activeAssignments.stream().anyMatch(a -> "FIELD_WORKER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "FIELD_WORKER";
        }

        String tenantName = null;
        String tenantCode = null;
        if (user.getTenantId() != null) {
            Optional<com.farm.saas.modules.platform.entity.Tenant> tOpt = tenantRepository.findById(user.getTenantId());
            if (tOpt.isPresent()) {
                tenantName = tOpt.get().getName();
                tenantCode = tOpt.get().getCode();
            }
        }

        return UserDetailResponse.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .tenantName(tenantName)
                .tenantCode(tenantCode)
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

    @Override
    @Transactional(readOnly = true)
    public List<RoleMatrixResponse> getRolesForFarm(Long farmId) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền truy cập trang trại này");
        }
        List<Role> roles = roleRepository.findAvailableRolesForFarm(farmId);
        Map<Long, Long> roleUserCounts = new HashMap<>();
        try {
            List<com.farm.saas.modules.auth.dto.response.FarmMemberResponse> farmMembers = getFarmMembers(farmId);
            for (com.farm.saas.modules.auth.dto.response.FarmMemberResponse fm : farmMembers) {
                if (fm.getRoleId() != null) {
                    roleUserCounts.merge(fm.getRoleId(), 1L, Long::sum);
                }
            }
        } catch (Exception ignored) {
        }
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
                    .farmId(role.getFarmId())
                    .isSystem(Boolean.TRUE.equals(role.getIsSystem()))
                    .description(role.getDescription())
                    .userCount(roleUserCounts.getOrDefault(role.getId(), 0L))
                    .permissions(permDtos)
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional
    public RoleMatrixResponse createCustomRole(Long farmId, com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest request) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thao tác trên trang trại này");
        }
        String slug = request.getName().trim().toUpperCase().replaceAll("[^A-Z0-9_]+", "_");
        String code = "ROLE_CUSTOM_" + farmId + "_" + (slug.length() > 15 ? slug.substring(0, 15) : slug) + "_" + (System.currentTimeMillis() % 10000);

        Role role = Role.builder()
                .code(code)
                .name(request.getName().trim())
                .scopeLevel("FARM")
                .farmId(farmId)
                .isSystem(false)
                .description(request.getDescription())
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        Role savedRole = roleRepository.save(role);

        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            List<RolePermission> rps = request.getPermissionIds().stream()
                    .map(pId -> RolePermission.builder()
                            .roleId(savedRole.getId())
                            .permissionId(pId)
                            .build())
                    .toList();
            rolePermissionRepository.saveAll(rps);
        }

        List<Permission> perms = permissionRepository.findAllById(request.getPermissionIds() != null ? request.getPermissionIds() : Collections.emptyList());
        List<RoleMatrixResponse.PermissionDto> permDtos = perms.stream()
                .map(p -> RoleMatrixResponse.PermissionDto.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getDescription() != null ? p.getDescription() : p.getCode())
                        .module(p.getModule())
                        .description(p.getDescription())
                        .build())
                .toList();

        return RoleMatrixResponse.builder()
                .id(savedRole.getId())
                .code(savedRole.getCode())
                .name(savedRole.getName())
                .scopeLevel(savedRole.getScopeLevel())
                .farmId(savedRole.getFarmId())
                .isSystem(false)
                .description(savedRole.getDescription())
                .permissions(permDtos)
                .build();
    }

    @Override
    @Transactional
    public RoleMatrixResponse updateCustomRole(Long farmId, Long roleId, com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest request) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thao tác trên trang trại này");
        }
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Không tìm thấy vai trò"));
        if (Boolean.TRUE.equals(role.getIsSystem())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_MODIFY_SYSTEM_ROLE", "Không thể chỉnh sửa vai trò mẫu mặc định của hệ thống");
        }
        if (role.getFarmId() == null || !role.getFarmId().equals(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Vai trò này không thuộc trang trại đang chọn");
        }
        role.setName(request.getName().trim());
        role.setDescription(request.getDescription());
        role.setUpdatedAt(Instant.now());
        role.setUpdatedBy(SecurityUtils.getCurrentUserId());
        Role savedRole = roleRepository.save(role);

        rolePermissionRepository.deleteByRoleId(role.getId());
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            List<RolePermission> rps = request.getPermissionIds().stream()
                    .map(pId -> RolePermission.builder()
                            .roleId(savedRole.getId())
                            .permissionId(pId)
                            .build())
                    .toList();
            rolePermissionRepository.saveAll(rps);
        }

        List<Permission> perms = permissionRepository.findAllById(request.getPermissionIds() != null ? request.getPermissionIds() : Collections.emptyList());
        List<RoleMatrixResponse.PermissionDto> permDtos = perms.stream()
                .map(p -> RoleMatrixResponse.PermissionDto.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getDescription() != null ? p.getDescription() : p.getCode())
                        .module(p.getModule())
                        .description(p.getDescription())
                        .build())
                .toList();

        return RoleMatrixResponse.builder()
                .id(savedRole.getId())
                .code(savedRole.getCode())
                .name(savedRole.getName())
                .scopeLevel(savedRole.getScopeLevel())
                .farmId(savedRole.getFarmId())
                .isSystem(false)
                .description(savedRole.getDescription())
                .permissions(permDtos)
                .build();
    }

    @Override
    @Transactional
    public void deleteCustomRole(Long farmId, Long roleId) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thao tác trên trang trại này");
        }
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Không tìm thấy vai trò"));
        if (Boolean.TRUE.equals(role.getIsSystem())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_DELETE_SYSTEM_ROLE", "Không thể xóa vai trò mặc định của hệ thống");
        }
        if (role.getFarmId() == null || !role.getFarmId().equals(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Vai trò này không thuộc trang trại đang chọn");
        }
        rolePermissionRepository.deleteByRoleId(roleId);
        roleRepository.delete(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleMatrixResponse.PermissionDto> getAllPermissions() {
        return permissionRepository.findAllByOrderByModuleAscCodeAsc().stream()
                .map(p -> RoleMatrixResponse.PermissionDto.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getDescription() != null ? p.getDescription() : p.getCode())
                        .module(p.getModule())
                        .description(p.getDescription())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.farm.saas.modules.auth.dto.response.FarmMemberResponse> getFarmMembers(Long farmId) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền truy cập trang trại này");
        }
        List<com.farm.saas.modules.auth.entity.FarmMember> members = farmMemberRepository.findByFarmId(farmId);
        List<com.farm.saas.modules.auth.dto.response.FarmMemberResponse> responses = new ArrayList<>();
        for (com.farm.saas.modules.auth.entity.FarmMember m : members) {
            Optional<User> uOpt = userRepository.findById(m.getUserId());
            Optional<Role> rOpt = roleRepository.findById(m.getRoleId());
            List<Long> bIds = Collections.emptyList();
            if (m.getBarnIds() != null && !m.getBarnIds().isBlank()) {
                try {
                    String raw = m.getBarnIds().trim();
                    if (raw.startsWith("[") && raw.endsWith("]")) {
                        raw = raw.substring(1, raw.length() - 1).trim();
                        if (!raw.isEmpty()) {
                            bIds = Arrays.stream(raw.split(","))
                                    .map(String::trim)
                                    .filter(s -> !s.isEmpty())
                                    .map(Long::parseLong)
                                    .toList();
                        }
                    }
                } catch (Exception ignored) {}
            }
            responses.add(com.farm.saas.modules.auth.dto.response.FarmMemberResponse.builder()
                    .id(m.getId())
                    .farmId(m.getFarmId())
                    .userId(m.getUserId())
                    .username(uOpt.map(User::getUsername).orElse(null))
                    .fullName(uOpt.map(User::getFullName).orElse(null))
                    .email(uOpt.map(User::getEmail).orElse(null))
                    .phone(uOpt.map(User::getPhone).orElse(null))
                    .roleId(m.getRoleId())
                    .roleCode(rOpt.map(Role::getCode).orElse(null))
                    .roleName(rOpt.map(Role::getName).orElse(null))
                    .isSystemRole(rOpt.map(r -> Boolean.TRUE.equals(r.getIsSystem())).orElse(false))
                    .branchId(m.getBranchId())
                    .allBarns(m.getAllBarns() != null ? m.getAllBarns() : true)
                    .barnIds(bIds)
                    .createdAt(m.getCreatedAt())
                    .updatedAt(m.getUpdatedAt())
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional
    public com.farm.saas.modules.auth.dto.response.FarmMemberResponse upsertFarmMember(Long farmId, com.farm.saas.modules.auth.dto.request.FarmMemberRequest request) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền quản lý nhân sự trang trại này");
        }
        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));
        Role targetRole = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Không tìm thấy vai trò"));

        String barnIdsJson = "[]";
        if (request.getBarnIds() != null && !request.getBarnIds().isEmpty()) {
            barnIdsJson = request.getBarnIds().toString();
        }

        com.farm.saas.modules.auth.entity.FarmMember member = farmMemberRepository.findByFarmIdAndUserId(farmId, request.getUserId())
                .orElseGet(() -> com.farm.saas.modules.auth.entity.FarmMember.builder()
                        .tenantId(targetUser.getTenantId() != null ? targetUser.getTenantId() : 1L)
                        .farmId(farmId)
                        .userId(targetUser.getId())
                        .build());

        member.setRoleId(targetRole.getId());
        if ("ROLE_FARM_OWNER".equalsIgnoreCase(targetRole.getCode())) {
            member.setBranchId(null);
        } else if (request.getBranchId() != null) {
            member.setBranchId(request.getBranchId());
        } else if (member.getBranchId() == null) {
            member.setBranchId(1L);
        }
        member.setAllBarns(Boolean.TRUE.equals(request.getAllBarns()));
        member.setBarnIds(barnIdsJson);
        member.setUpdatedAt(Instant.now());
        member.setUpdatedBy(SecurityUtils.getCurrentUserId());
        com.farm.saas.modules.auth.entity.FarmMember saved = farmMemberRepository.save(member);

        // Also ensure user_roles has this role assigned for the farm
        boolean alreadyHasRole = userRoleRepository.existsByUserIdAndRoleIdAndFarmId(request.getUserId(), targetRole.getId(), farmId);
        if (!alreadyHasRole) {
            userRoleRepository.save(com.farm.saas.modules.auth.entity.UserRole.builder()
                    .tenantId(targetUser.getTenantId() != null ? targetUser.getTenantId() : 1L)
                    .userId(targetUser.getId())
                    .roleId(targetRole.getId())
                    .farmId(farmId)
                    .assignedAt(Instant.now())
                    .assignedBy(SecurityUtils.getCurrentUserId())
                    .build());
        }

        return com.farm.saas.modules.auth.dto.response.FarmMemberResponse.builder()
                .id(saved.getId())
                .farmId(saved.getFarmId())
                .userId(saved.getUserId())
                .username(targetUser.getUsername())
                .fullName(targetUser.getFullName())
                .email(targetUser.getEmail())
                .phone(targetUser.getPhone())
                .roleId(targetRole.getId())
                .roleCode(targetRole.getCode())
                .roleName(targetRole.getName())
                .isSystemRole(Boolean.TRUE.equals(targetRole.getIsSystem()))
                .branchId(saved.getBranchId())
                .allBarns(saved.getAllBarns())
                .barnIds(request.getBarnIds())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void removeFarmMember(Long farmId, Long userId) {
        if (!farmSecurity.canAccessFarm(farmId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền quản lý nhân sự trang trại này");
        }
        farmMemberRepository.deleteByFarmIdAndUserId(farmId, userId);
        userRoleRepository.deleteByUserIdAndFarmId(userId, farmId);
        userFarmAccessRepository.deleteByUserIdAndFarmId(userId, farmId);
    }
}
