package com.farm.saas.modules.auth.service;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.dto.request.ChangePasswordRequest;
import com.farm.saas.modules.auth.dto.request.LoginRequest;
import com.farm.saas.modules.auth.dto.response.AuthResponse;
import com.farm.saas.modules.auth.dto.response.UserInfoDto;
import com.farm.saas.modules.auth.entity.RefreshToken;
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
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.platform.entity.Tenant;
import com.farm.saas.modules.platform.entity.TenantSubscription;
import com.farm.saas.modules.platform.repository.TenantRepository;
import com.farm.saas.modules.platform.repository.TenantSubscriptionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final FarmRepository farmRepository;
    private final EmployeeRepository employeeRepository;
    private final TenantRepository tenantRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    private static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không chính xác."));

        if (user.getLockUntil() != null && user.getLockUntil().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản đang bị tạm khóa do nhập sai mật khẩu quá nhiều lần.");
        }

        if (user.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(user.getTenantId())
                    .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "TENANT_NOT_FOUND", "Khách thuê không tồn tại."));
            if ("SUSPENDED".equalsIgnoreCase(tenant.getStatus()) || "INACTIVE".equalsIgnoreCase(tenant.getStatus())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "TENANT_SUSPENDED", "Khách thuê đã bị tạm ngưng hoặc vô hiệu hóa.");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int failed = (user.getFailedLogins() != null ? user.getFailedLogins() : 0) + 1;
            user.setFailedLogins(failed);
            if (failed >= 5) {
                user.setLockUntil(Instant.now().plusSeconds(15 * 60));
            }
            userRepository.save(user);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "Tài khoản đang ở trạng thái không hoạt động.");
        }

        validateFarmActiveForPersonnel(user);

        user.setFailedLogins(0);
        user.setLockUntil(null);
        userRepository.save(user);

        UserInfoDto userInfo = buildUserInfoDto(user);
        CustomUserDetails userDetails = buildUserDetails(user, userInfo);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenStr)
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 3600))
                .revoked(false)
                .createdAt(Instant.now())
                .createdByIp(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .build();
        refreshTokenRepository.save(refreshToken);

        setRefreshTokenCookie(httpResponse, refreshTokenStr, 7 * 24 * 3600);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(user.getId())
                .action("LOGIN")
                .module("AUTH")
                .endpoint("/api/v1/auth/login")
                .method("POST")
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(1800L)
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .userInfo(userInfo)
                .build();
    }

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse refreshToken(String refreshTokenStr, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "MISSING_REFRESH_TOKEN", "Thiếu mã làm mới phiên đăng nhập.");
        }

        RefreshToken token = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Mã làm mới không hợp lệ."));

        // Chống Token Replay Attack (File 05 Mục 2.1)
        if (Boolean.TRUE.equals(token.getRevoked())) {
            log.warn("DETECTED REPLAY ATTACK on refresh token {} for user {}", token.getId(), token.getUserId());
            refreshTokenRepository.revokeAllByUserId(token.getUserId(), Instant.now());

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .userId(token.getUserId())
                    .action("TOKEN_REPLAY_ATTACK")
                    .module("SECURITY_ALERT")
                    .oldValue(token.getToken())
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .build());

            clearRefreshTokenCookie(httpResponse);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REVOKED", "Mã làm mới đã bị thu hồi hoặc nghi vấn bị đánh cắp! Toàn bộ phiên làm việc của tài khoản đã bị vô hiệu hóa.");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "Mã làm mới đã hết hạn.");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Người dùng không tồn tại."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "Tài khoản đang bị khóa.");
        }

        if (user.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(user.getTenantId()).orElse(null);
            if (tenant != null && ("SUSPENDED".equalsIgnoreCase(tenant.getStatus()) || "INACTIVE".equalsIgnoreCase(tenant.getStatus()))) {
                throw new ApiException(HttpStatus.FORBIDDEN, "TENANT_SUSPENDED", "Khách thuê đã bị tạm ngưng hoặc vô hiệu hóa.");
            }
        }

        validateFarmActiveForPersonnel(user);

        // Xoay vòng Refresh Token (Token Rotation)
        String newRefreshTokenStr = UUID.randomUUID().toString();
        token.setRevoked(true);
        token.setRevokedAt(Instant.now());
        token.setReplacedByToken(newRefreshTokenStr);
        refreshTokenRepository.save(token);

        RefreshToken newToken = RefreshToken.builder()
                .userId(user.getId())
                .token(newRefreshTokenStr)
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 3600))
                .revoked(false)
                .createdAt(Instant.now())
                .createdByIp(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .build();
        refreshTokenRepository.save(newToken);

        UserInfoDto userInfo = buildUserInfoDto(user);
        CustomUserDetails userDetails = buildUserDetails(user, userInfo);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        setRefreshTokenCookie(httpResponse, newRefreshTokenStr, 7 * 24 * 3600);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(1800L)
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .userInfo(userInfo)
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshTokenStr, HttpServletResponse httpResponse) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
                token.setRevoked(true);
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            });
        }
        clearRefreshTokenCookie(httpResponse);
    }

    @Override
    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Chưa đăng nhập.");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại."));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OLD_PASSWORD", "Mật khẩu cũ không chính xác.");
        }

        if (request.getNewPassword() == null || !PASSWORD_PATTERN.matcher(request.getNewPassword()).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_TOO_WEAK", "Mật khẩu mới không đạt chuẩn bảo mật (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt).");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now());
        userRepository.saveAndFlush(user);

        // Thu hồi toàn bộ refresh token cũ
        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());

        // Sinh cặp Token mới với mustChangePassword = false để người dùng tiếp tục phiên làm việc mượt mà
        String newRefreshTokenStr = UUID.randomUUID().toString();
        RefreshToken newToken = RefreshToken.builder()
                .userId(user.getId())
                .token(newRefreshTokenStr)
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 3600))
                .revoked(false)
                .createdAt(Instant.now())
                .createdByIp(getClientIp(httpRequest))
                .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                .build();
        refreshTokenRepository.save(newToken);

        if (httpResponse != null) {
            setRefreshTokenCookie(httpResponse, newRefreshTokenStr, 7 * 24 * 3600);
        }

        UserInfoDto userInfo = buildUserInfoDto(user);
        CustomUserDetails userDetails = buildUserDetails(user, userInfo);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(user.getTenantId())
                .userId(user.getId())
                .action("CHANGE_PASSWORD")
                .module("AUTH")
                .endpoint("/api/v1/auth/change-password")
                .method("POST")
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(1800L)
                .mustChangePassword(false)
                .userInfo(userInfo)
                .build();
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        changePassword(request, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserInfoDto getMe() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Chưa đăng nhập.");
        }
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại."));
        return buildUserInfoDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getMyPermissions() {
        UserInfoDto me = getMe();
        return me.getPermissions();
    }

    private UserInfoDto buildUserInfoDto(User user) {
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
                }).toList();

        List<String> permCodes = new ArrayList<>();
        if (!roleIds.isEmpty()) {
            List<Long> permIds = rolePermissionRepository.findByRoleIdIn(roleIds).stream()
                    .map(RolePermission::getPermissionId)
                    .distinct()
                    .collect(Collectors.toList());
            permCodes = permissionRepository.findAllById(permIds).stream()
                    .map(com.farm.saas.modules.auth.entity.Permission::getCode)
                    .collect(Collectors.toList());
        }

        boolean isSuperAdmin = Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getCode()));
        if (roleDtos.isEmpty() && isSuperAdmin) {
            roleDtos = List.of(UserInfoDto.RoleDto.builder()
                    .code("ROLE_SUPER_ADMIN")
                    .name("Cấp 1: Quản trị viên nền tảng")
                    .scopeLevel("SYSTEM")
                    .build());
        }

        int highestTier;
        String primaryScope;
        if (isSuperAdmin) {
            highestTier = 1;
            primaryScope = "SYSTEM";
        } else if (roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()))) {
            highestTier = 2;
            primaryScope = "TENANT";
        } else if (roles.stream().anyMatch(r -> "ROLE_FARM_MANAGER".equals(r.getCode()))) {
            highestTier = 3;
            primaryScope = "FARM";
        } else {
            highestTier = 4;
            primaryScope = "FARM";
        }

        boolean isOwnerTenantScope = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()) && "TENANT".equalsIgnoreCase(r.getScopeLevel()));
        boolean hasOwnerRole = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()));
        boolean hasAccountantRole = roles.stream().anyMatch(r -> "ROLE_ACCOUNTANT".equals(r.getCode()));
        boolean hasTechRole = roles.stream().anyMatch(r -> "ROLE_TECHNICAL_STAFF".equals(r.getCode()));
        boolean hasWarehouseRole = roles.stream().anyMatch(r -> "ROLE_WAREHOUSE_STAFF".equals(r.getCode()));
        boolean hasFieldStaffRole = roles.stream().anyMatch(r -> "ROLE_FIELD_STAFF".equals(r.getCode()));

        // Fetch Farm Assignments
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

        // Dynamic Field Leadership Promotion: ZONE_MANAGER automatically gets PERM_TASK_ASSIGN
        if (activeAssignments.stream().anyMatch(a -> "ZONE_MANAGER".equalsIgnoreCase(a.getRoleInFarm()))) {
            if (!permCodes.contains("PERM_TASK_ASSIGN")) {
                permCodes = new ArrayList<>(permCodes);
                permCodes.add("PERM_TASK_ASSIGN");
            }
        }

        // Collect accessible farm IDs
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

        // Operational Role resolution
        String operationalRole = "STAFF";
        if (isSuperAdmin) {
            operationalRole = "SUPER_ADMIN";
        } else if (isOwnerTenantScope || (hasOwnerRole && !isDirectFarmManager && farmDtos.size() > 1)) {
            operationalRole = "OWNER";
        } else if (isDirectFarmManager || (hasOwnerRole && !isOwnerTenantScope)) {
            operationalRole = "FARM_MANAGER";
        } else if (hasAccountantRole) {
            operationalRole = "FARM_ACCOUNTANT";
        } else if (activeAssignments.stream().anyMatch(a -> "ZONE_MANAGER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "ZONE_MANAGER";
        } else if (hasTechRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("TECHNICAL_LEAD", "AGRONOMIST", "VETERINARIAN").contains(a.getRoleInFarm()))) {
            operationalRole = "TECHNICAL_LEAD";
        } else if (hasWarehouseRole || activeAssignments.stream().anyMatch(a -> "WAREHOUSE_KEEPER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "WAREHOUSE_KEEPER";
        } else if (hasFieldStaffRole || activeAssignments.stream().anyMatch(a -> "FIELD_WORKER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "FIELD_WORKER";
        }

        Integer maxFarms = null;
        String planType = null;
        if (user.getTenantId() != null) {
            TenantSubscription activeSub = tenantSubscriptionRepository.findByTenantIdAndIsActiveTrue(user.getTenantId()).orElse(null);
            if (activeSub != null) {
                maxFarms = activeSub.getMaxFarms();
                planType = activeSub.getPlanType();
            }
        }

        Long employeeId = null;
        if (user.getId() != null) {
            employeeId = employeeRepository.findByUserId(user.getId())
                    .map(Employee::getId)
                    .orElse(null);
        }

        return UserInfoDto.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .isSuperAdmin(isSuperAdmin)
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .roles(roleDtos)
                .permissions(permCodes)
                .accessibleFarms(farmDtos)
                .farmAssignments(assignmentDtos)
                .operationalRole(operationalRole)
                .highestTier(highestTier)
                .primaryScope(primaryScope)
                .maxFarms(maxFarms)
                .planType(planType)
                .employeeId(employeeId)
                .build();
    }

    private CustomUserDetails buildUserDetails(User user, UserInfoDto userInfo) {
        Set<String> roleCodes = userInfo.getRoles().stream().map(UserInfoDto.RoleDto::getCode).collect(Collectors.toSet());
        Set<String> permCodes = new HashSet<>(userInfo.getPermissions());
        Set<Long> accessibleFarmIds = userInfo.getAccessibleFarms().stream().map(UserInfoDto.AccessibleFarmDto::getFarmId).collect(Collectors.toSet());

        return CustomUserDetails.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .passwordHash(user.getPasswordHash())
                .isSuperAdmin(Boolean.TRUE.equals(user.getIsSuperAdmin()))
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .roles(roleCodes)
                .permissions(permCodes)
                .accessibleFarmIds(accessibleFarmIds)
                .tierLevel(userInfo.getHighestTier())
                .build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(false) // Allow test environments without HTTPS
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xf = request.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : request.getRemoteAddr();
    }

    private void validateFarmActiveForPersonnel(User user) {
        if (Boolean.TRUE.equals(user.getIsSuperAdmin())) {
            return;
        }

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        Set<Long> roleIds = userRoles.stream().map(UserRole::getRoleId).collect(Collectors.toSet());
        List<Role> roles = roleRepository.findAllById(roleIds);

        boolean isSuperAdmin = roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(r.getCode()));
        if (isSuperAdmin) {
            return;
        }

        boolean isOwner = roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equalsIgnoreCase(r.getCode()));
        if (isOwner) {
            return;
        }

        // Với tất cả tài khoản nhân sự (Tier 3 Farm Manager & Tier 4 Staff):
        // 1. Kiểm tra trang trại của nhân viên trong bảng employees
        Optional<Employee> employeeOpt = employeeRepository.findByUserId(user.getId());
        if (employeeOpt.isPresent() && employeeOpt.get().getFarmId() != null) {
            Long farmId = employeeOpt.get().getFarmId();
            Farm farm = farmRepository.findById(farmId).orElse(null);
            if (farm != null && !"ACTIVE".equalsIgnoreCase(farm.getStatus())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FARM_INACTIVE", "Trang trại đã ngừng hoạt động");
            }
        }

        // 2. Thu thập toàn bộ các trang trại liên kết với tài khoản này
        Set<Long> associatedFarmIds = new LinkedHashSet<>();
        employeeOpt.map(Employee::getFarmId).filter(Objects::nonNull).ifPresent(associatedFarmIds::add);
        userRoles.stream().map(UserRole::getFarmId).filter(Objects::nonNull).forEach(associatedFarmIds::add);
        userFarmAccessRepository.findByUserId(user.getId()).stream().map(UserFarmAccess::getFarmId).filter(Objects::nonNull).forEach(associatedFarmIds::add);
        farmRepository.findByManagerUserId(user.getId()).stream().map(Farm::getId).forEach(associatedFarmIds::add);
        farmAssignmentRepository.findByUserIdAndIsActiveTrue(user.getId()).stream().map(FarmAssignment::getFarmId).filter(Objects::nonNull).forEach(associatedFarmIds::add);

        if (!associatedFarmIds.isEmpty()) {
            boolean hasActiveFarm = false;
            for (Long fId : associatedFarmIds) {
                Optional<Farm> fOpt = farmRepository.findById(fId);
                if (fOpt.isPresent() && "ACTIVE".equalsIgnoreCase(fOpt.get().getStatus())) {
                    hasActiveFarm = true;
                    break;
                }
            }
            if (!hasActiveFarm) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FARM_INACTIVE", "Trang trại đã ngừng hoạt động");
            }
        }
    }
}
