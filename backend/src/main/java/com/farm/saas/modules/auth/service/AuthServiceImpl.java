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
import com.farm.saas.modules.geography.entity.Branch;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.FarmAssignment;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.BranchRepository;
import com.farm.saas.modules.geography.repository.FarmAssignmentRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.UserFarmAccessRepository;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.auth.entity.FarmMember;
import com.farm.saas.modules.auth.repository.FarmMemberRepository;
import com.farm.saas.modules.auth.entity.EmailVerificationOtp;
import com.farm.saas.modules.auth.repository.EmailVerificationOtpRepository;
import java.math.BigDecimal;
import com.farm.saas.modules.workforce.entity.Employee;
import com.farm.saas.modules.workforce.repository.EmployeeRepository;
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
    private final EmailVerificationOtpRepository emailVerificationOtpRepository;
    private final FarmMemberRepository farmMemberRepository;
    private final BranchRepository branchRepository;
    private final WarehouseRepository warehouseRepository;
    private final FarmAddOnSubscriptionRepository farmAddOnSubscriptionRepository;

    private static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .or(() -> userRepository.findByPhone(request.getUsername()))
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
                .refreshToken(refreshTokenStr)
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

        // Chống Token Replay Attack (File 05 Mục 2.1) với Grace Period 30 giây cho network concurrency
        if (Boolean.TRUE.equals(token.getRevoked())) {
            if (token.getReplacedByToken() != null && token.getRevokedAt() != null &&
                    token.getRevokedAt().isAfter(Instant.now().minusSeconds(30))) {
                RefreshToken replacement = refreshTokenRepository.findByToken(token.getReplacedByToken()).orElse(null);
                if (replacement != null && !Boolean.TRUE.equals(replacement.getRevoked()) &&
                        replacement.getExpiresAt().isAfter(Instant.now())) {
                    token = replacement;
                }
            }
        }

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
                .refreshToken(newRefreshTokenStr)
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
                .refreshToken(newRefreshTokenStr)
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

        boolean isSuperAdmin = Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getCode()));
        if (roleDtos.isEmpty() && isSuperAdmin) {
            roleDtos = List.of(UserInfoDto.RoleDto.builder()
                    .code("ROLE_SUPER_ADMIN")
                    .name("Cấp 1: Quản trị viên nền tảng")
                    .scopeLevel("SYSTEM")
                    .build());
        }

        List<String> permCodes = new ArrayList<>();
        if (isSuperAdmin) {
            permCodes = permissionRepository.findAll().stream()
                    .map(com.farm.saas.modules.auth.entity.Permission::getCode)
                    .collect(Collectors.toList());
        } else if (roles.stream().anyMatch(r -> "ROLE_FARM_OWNER".equals(r.getCode()))) {
            // Farm Owner has all operational permissions within tenant (all except PERM_TENANT_MANAGE)
            permCodes = permissionRepository.findAll().stream()
                    .map(com.farm.saas.modules.auth.entity.Permission::getCode)
                    .filter(c -> !"PERM_TENANT_MANAGE".equals(c))
                    .collect(Collectors.toList());
        } else if (!roleIds.isEmpty()) {
            List<Long> permIds = rolePermissionRepository.findByRoleIdIn(roleIds).stream()
                    .map(RolePermission::getPermissionId)
                    .distinct()
                    .collect(Collectors.toList());
            permCodes = permissionRepository.findAllById(permIds).stream()
                    .map(com.farm.saas.modules.auth.entity.Permission::getCode)
                    .collect(Collectors.toList());
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

        userRoles.stream().map(UserRole::getFarmId).filter(Objects::nonNull).forEach(accessibleFarmIds::add);
        employeeRepository.findByUserId(user.getId()).map(Employee::getFarmId).filter(Objects::nonNull).ifPresent(accessibleFarmIds::add);

        List<Farm> managedFarms = farmRepository.findByManagerUserId(user.getId());
        for (Farm mf : managedFarms) {
            accessibleFarmIds.add(mf.getId());
        }

        for (FarmAssignment fa : activeAssignments) {
            accessibleFarmIds.add(fa.getFarmId());
        }

        if (isSuperAdmin) {
            List<Farm> allFarms = farmRepository.findAll();
            for (Farm f : allFarms) {
                if (!"DELETED".equalsIgnoreCase(f.getStatus())) {
                    accessibleFarmIds.add(f.getId());
                }
            }
        } else if (isOwnerTenantScope && user.getTenantId() != null) {
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

                Boolean allBarns = true;
                Long memberBranchId = null;
                List<Long> barnIds = Collections.emptyList();
                var farmMemberOpt = farmMemberRepository.findByFarmIdAndUserId(farm.getId(), user.getId());
                if (farmMemberOpt.isPresent()) {
                    var fm = farmMemberOpt.get();
                    allBarns = fm.getAllBarns() != null ? fm.getAllBarns() : true;
                    memberBranchId = (!hasOwnerRole && !isSuperAdmin) ? fm.getBranchId() : null;
                    if (fm.getBarnIds() != null && !fm.getBarnIds().isBlank()) {
                        try {
                            String raw = fm.getBarnIds().trim();
                            if (raw.startsWith("[") && raw.endsWith("]")) {
                                raw = raw.substring(1, raw.length() - 1).trim();
                                if (!raw.isEmpty()) {
                                    barnIds = Arrays.stream(raw.split(","))
                                            .map(String::trim)
                                            .filter(s -> !s.isEmpty())
                                            .map(Long::parseLong)
                                            .toList();
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }

                final Long scopedBranchId = memberBranchId;
                List<Branch> branches = branchRepository.findByFarmIdOrderByIsDefaultDescIdAsc(farm.getId());
                List<UserInfoDto.BranchDto> branchDtos = branches.stream()
                        .filter(b -> scopedBranchId == null || b.getId().equals(scopedBranchId))
                        .map(b -> UserInfoDto.BranchDto.builder()
                        .id(b.getId())
                        .farmId(b.getFarmId())
                        .code(b.getCode())
                        .name(b.getName())
                        .livestockType(b.getLivestockType())
                        .address(b.getAddress())
                        .phone(b.getPhone())
                        .isDefault(Boolean.TRUE.equals(b.getIsDefault()))
                        .status(b.getStatus())
                        .build()).toList();

                List<FarmAddOnSubscription> addOns = farmAddOnSubscriptionRepository.findByFarmId(farm.getId());
                List<UserInfoDto.FarmAddOnDto> addOnDtos = addOns.stream()
                        .map(a -> UserInfoDto.FarmAddOnDto.builder()
                                .id(a.getId())
                                .farmId(a.getFarmId())
                                .addonCode(a.getAddonCode())
                                .status(a.getStatus())
                                .isEnabled("ACTIVE".equalsIgnoreCase(a.getStatus()))
                                .expiresAt(a.getExpiresAt())
                                .build()).toList();

                farmDtos.add(UserInfoDto.AccessibleFarmDto.builder()
                        .farmId(farm.getId())
                        .farmCode(farm.getCode())
                        .farmName(farm.getName())
                        .farmType(farm.getFarmType())
                        .assignedRole(assignedRole)
                        .isManager(isManagerOfThisFarm || isOwnerTenantScope)
                        .managerUserId(farm.getManagerUserId())
                        .allBarns(allBarns)
                        .barnIds(barnIds)
                        .allowedBarnIds(barnIds)
                        .branches(branchDtos)
                        .farmAddOnSubscriptions(addOnDtos)
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
        } else if (hasAccountantRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("FARM_ACCOUNTANT", "ACCOUNTANT", "WAREHOUSE_KEEPER").contains(a.getRoleInFarm()))) {
            operationalRole = "FARM_ACCOUNTANT";
        } else if (activeAssignments.stream().anyMatch(a -> "ZONE_MANAGER".equalsIgnoreCase(a.getRoleInFarm()))) {
            operationalRole = "ZONE_MANAGER";
        } else if (hasTechRole || activeAssignments.stream().anyMatch(a -> Arrays.asList("TECHNICAL_LEAD", "AGRONOMIST", "VETERINARIAN").contains(a.getRoleInFarm()))) {
            operationalRole = "TECHNICAL_LEAD";
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

        Boolean rootAllBarns = true;
        List<Long> rootAllowedBarnIds = Collections.emptyList();
        List<UserInfoDto.BranchDto> rootBranches = Collections.emptyList();
        List<UserInfoDto.FarmAddOnDto> rootAddOns = Collections.emptyList();

        if (isSuperAdmin) {
            rootAllBarns = true;
            rootAllowedBarnIds = Collections.emptyList();
            rootBranches = branchRepository.findAll().stream().map(b -> UserInfoDto.BranchDto.builder()
                    .id(b.getId())
                    .farmId(b.getFarmId())
                    .code(b.getCode())
                    .name(b.getName())
                    .livestockType(b.getLivestockType())
                    .address(b.getAddress())
                    .phone(b.getPhone())
                    .isDefault(Boolean.TRUE.equals(b.getIsDefault()))
                    .status(b.getStatus())
                    .build()).toList();
            rootAddOns = List.of(
                    UserInfoDto.FarmAddOnDto.builder().addonCode("BRANCHES").status("ACTIVE").isEnabled(true).build(),
                    UserInfoDto.FarmAddOnDto.builder().addonCode("PAYROLL").status("ACTIVE").isEnabled(true).build(),
                    UserInfoDto.FarmAddOnDto.builder().addonCode("CUSTOM_ROLES").status("ACTIVE").isEnabled(true).build(),
                    UserInfoDto.FarmAddOnDto.builder().addonCode("BREEDING").status("ACTIVE").isEnabled(true).build(),
                    UserInfoDto.FarmAddOnDto.builder().addonCode("POULTRY_HATCHERY").status("ACTIVE").isEnabled(true).build(),
                    UserInfoDto.FarmAddOnDto.builder().addonCode("FEED_MILL").status("ACTIVE").isEnabled(true).build()
            );
        } else if (!farmDtos.isEmpty()) {
            UserInfoDto.AccessibleFarmDto primary = farmDtos.get(0);
            rootAllBarns = primary.getAllBarns();
            rootAllowedBarnIds = primary.getAllowedBarnIds() != null ? primary.getAllowedBarnIds() : Collections.emptyList();
            rootBranches = primary.getBranches() != null ? primary.getBranches() : Collections.emptyList();
            rootAddOns = primary.getFarmAddOnSubscriptions() != null ? primary.getFarmAddOnSubscriptions() : Collections.emptyList();
        }

        Long rootAssignedBranchId = null;
        if (!isSuperAdmin && !hasOwnerRole && !rootBranches.isEmpty()) {
            rootAssignedBranchId = rootBranches.get(0).getId();
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
                .assignedBranchId(rootAssignedBranchId)
                .allBarns(rootAllBarns)
                .allowedBarnIds(rootAllowedBarnIds)
                .branches(rootBranches)
                .farmAddOnSubscriptions(rootAddOns)
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
                .isSuperAdmin(Boolean.TRUE.equals(userInfo.getIsSuperAdmin()))
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

    @Override
    @Transactional
    public void sendEmailOtp(com.farm.saas.modules.auth.dto.request.SendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (!email.endsWith("@gmail.com")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL_DOMAIN", "Email bắt buộc phải có định dạng @gmail.com (ví dụ: user@gmail.com)");
        }
        if ("REGISTER".equalsIgnoreCase(request.getType())) {
            if (userRepository.existsByEmail(email)) {
                throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email này đã được sử dụng bởi một tài khoản khác.");
            }
        } else if ("FORGOT_PASSWORD".equalsIgnoreCase(request.getType())) {
            if (!userRepository.existsByEmail(email)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "EMAIL_NOT_FOUND", "Không tìm thấy tài khoản liên kết với email này.");
            }
        }

        // Tạo mã OTP 6 số
        String otpCode = String.format("%06d", new java.util.Random().nextInt(1000000));
        Instant expiresAt = Instant.now().plusSeconds(5 * 60); // 5 phút

        com.farm.saas.modules.auth.entity.EmailVerificationOtp otp = com.farm.saas.modules.auth.entity.EmailVerificationOtp.builder()
                .email(email)
                .otpCode(otpCode)
                .otpType(request.getType().toUpperCase())
                .expiresAt(expiresAt)
                .isUsed(false)
                .createdAt(Instant.now())
                .build();
        emailVerificationOtpRepository.save(otp);

        log.info("[EMAIL OTP SERVICE] Gửi mã xác thực OTP {} tới email: {} (hết hạn lúc {})", otpCode, email, expiresAt);
    }

    @Override
    @Transactional
    public AuthResponse registerWithOtp(com.farm.saas.modules.auth.dto.request.RegisterWithOtpRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.getEmail().trim().toLowerCase();
        if (!email.endsWith("@gmail.com")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL_DOMAIN", "Email bắt buộc phải có định dạng @gmail.com");
        }
        String phone = request.getPhone().trim();
        String otpCode = request.getOtpCode().trim();

        // 1. Kiểm tra OTP
        com.farm.saas.modules.auth.entity.EmailVerificationOtp otp = emailVerificationOtpRepository
                .findTopByEmailAndOtpCodeAndOtpTypeAndIsUsedFalseAndExpiresAtAfter(email, otpCode, "REGISTER", Instant.now())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực OTP không chính xác hoặc đã hết hạn."));

        otp.setIsUsed(true);
        emailVerificationOtpRepository.save(otp);

        // 2. Kiểm tra trùng lặp SĐT & Email
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email này đã được đăng ký trong hệ thống.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_EXISTS", "Số điện thoại này đã được đăng ký trong hệ thống.");
        }

        // 3. Khởi tạo Khách thuê (Tenant) cho chủ trang trại mới
        String tenantCode = "TNT-" + String.format("%06d", new java.util.Random().nextInt(1000000));
        while (tenantRepository.existsByCode(tenantCode)) {
            tenantCode = "TNT-" + String.format("%06d", new java.util.Random().nextInt(1000000));
        }
        String subdomain = "trangtrai" + String.format("%06d", new java.util.Random().nextInt(1000000));
        while (tenantRepository.existsBySubdomain(subdomain)) {
            subdomain = "trangtrai" + String.format("%06d", new java.util.Random().nextInt(1000000));
        }
        Tenant tenant = Tenant.builder()
                .code(tenantCode)
                .name("Hộ kinh doanh " + request.getFullName().trim())
                .subdomain(subdomain)
                .subscriptionPlan("STANDARD")
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        tenant = tenantRepository.save(tenant);

        // 4. Khởi tạo tài khoản người dùng mới
        String username = phone;
        if (userRepository.existsByUsername(username)) {
            username = email.split("@")[0] + "_" + phone.substring(phone.length() - 4);
        }

        User newUser = User.builder()
                .tenantId(tenant.getId())
                .username(username)
                .email(email)
                .phone(phone)
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .isSuperAdmin(false)
                .mustChangePassword(false)
                .failedLogins(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        newUser = userRepository.save(newUser);

        // 5. Tự động tạo trang trại (Farm) mặc định
        String farmCode = "FARM-" + String.format("%04d", new java.util.Random().nextInt(10000));
        while (farmRepository.existsByTenantIdAndCode(tenant.getId(), farmCode)) {
            farmCode = "FARM-" + String.format("%04d", new java.util.Random().nextInt(10000));
        }
        Farm newFarm = Farm.builder()
                .tenantId(tenant.getId())
                .code(farmCode)
                .name("Trang trại " + request.getFullName().trim())
                .farmType("LIVESTOCK")
                .facilityType("HOG")
                .businessName("Hộ kinh doanh " + request.getFullName().trim())
                .totalAreaM2(BigDecimal.valueOf(1000.00))
                .geofenceRadiusM(300)
                .managerUserId(newUser.getId())
                .status("ACTIVE")
                .isDemo(false)
                .subscriptionTier("STANDARD")
                .subscriptionDurationYears(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        newFarm = farmRepository.save(newFarm);

        // 6. Tạo 1 Chi nhánh mặc định (farm_branches)
        Branch defaultBranch = Branch.builder()
                .farmId(newFarm.getId())
                .code("CN-CHINH")
                .name("Chi nhánh chính")
                .livestockType("LIVESTOCK_MEAT")
                .isDefault(true)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(newUser.getId())
                .build();
        defaultBranch = branchRepository.save(defaultBranch);

        // 7. Tạo Kho mặc định (warehouses)
        Warehouse defaultWarehouse = Warehouse.builder()
                .tenantId(tenant.getId())
                .farmId(newFarm.getId())
                .branchId(defaultBranch.getId())
                .code("KHO-TONG")
                .name("Kho tổng hợp")
                .warehouseType("GENERAL")
                .managerUserId(newUser.getId())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(newUser.getId())
                .build();
        warehouseRepository.save(defaultWarehouse);

        // 8. Gán vai trò ROLE_FARM_OWNER cho chủ trang trại
        Role ownerRole = roleRepository.findByCode("ROLE_FARM_OWNER")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_NOT_FOUND", "Không tìm thấy vai trò ROLE_FARM_OWNER"));

        userRoleRepository.save(UserRole.builder()
                .tenantId(tenant.getId())
                .userId(newUser.getId())
                .roleId(ownerRole.getId())
                .farmId(newFarm.getId())
                .assignedAt(Instant.now())
                .build());

        userFarmAccessRepository.save(UserFarmAccess.builder()
                .tenantId(tenant.getId())
                .userId(newUser.getId())
                .farmId(newFarm.getId())
                .grantedAt(Instant.now())
                .build());

        farmMemberRepository.save(FarmMember.builder()
                .tenantId(tenant.getId())
                .farmId(newFarm.getId())
                .userId(newUser.getId())
                .roleId(ownerRole.getId())
                .allBarns(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // Mặc định các dịch vụ mở rộng (như BRANCHES) ở trạng thái chưa kích hoạt (INACTIVE, isEnabled = false)
        // để chủ trang trại có thể trải nghiệm luồng mua và kích hoạt qua VNPAY Sandbox
        farmAddOnSubscriptionRepository.save(FarmAddOnSubscription.builder()
                .tenantId(tenant.getId())
                .farmId(newFarm.getId())
                .addonCode("BRANCHES")
                .status("INACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        log.info("Đăng ký thành công chủ trang trại mới: UserID={}, FarmID={}, TenantID={}, BranchID={}",
                newUser.getId(), newFarm.getId(), tenant.getId(), defaultBranch.getId());

        // 9. Sinh JWT và trả về phiên đăng nhập tự động
        UserInfoDto userInfo = buildUserInfoDto(newUser);
        CustomUserDetails userDetails = buildUserDetails(newUser, userInfo);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(newUser.getId())
                .token(refreshTokenStr)
                .expiresAt(Instant.now().plusSeconds(7 * 24 * 3600))
                .revoked(false)
                .createdAt(Instant.now())
                .createdByIp(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .build();
        refreshTokenRepository.save(refreshToken);

        setRefreshTokenCookie(httpResponse, refreshTokenStr, 7 * 24 * 3600);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(1800L)
                .mustChangePassword(false)
                .userInfo(userInfo)
                .build();
    }

    @Override
    @Transactional
    public void forgotPasswordWithOtp(com.farm.saas.modules.auth.dto.request.ForgotPasswordWithOtpRequest request) {
        String identifier = request.getIdentifier().trim();
        if (identifier.contains("@") && !identifier.toLowerCase().endsWith("@gmail.com")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL_DOMAIN", "Email bắt buộc phải có định dạng @gmail.com (ví dụ: user@gmail.com)");
        }
        String otpCode = request.getOtpCode().trim();

        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng với thông tin đã cung cấp."));

        com.farm.saas.modules.auth.entity.EmailVerificationOtp otp = emailVerificationOtpRepository
                .findTopByEmailAndOtpCodeAndOtpTypeAndIsUsedFalseAndExpiresAtAfter(user.getEmail(), otpCode, "FORGOT_PASSWORD", Instant.now())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực OTP không chính xác hoặc đã hết hạn."));

        otp.setIsUsed(true);
        emailVerificationOtpRepository.save(otp);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLogins(0);
        user.setLockUntil(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        log.info("Đặt lại mật khẩu thành công cho người dùng: ID={}, Email={}", user.getId(), user.getEmail());
    }
}
