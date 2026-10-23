package com.farm.saas.modules.platform.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.platform.dto.request.CreateSubscriptionRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.farm.saas.modules.platform.dto.request.UpdateTenantStatusRequest;
import com.farm.saas.modules.platform.dto.response.TenantDetailResponse;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Tenant;
import com.farm.saas.modules.platform.entity.TenantSubscription;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.TenantRepository;
import com.farm.saas.modules.platform.repository.TenantSubscriptionRepository;
import com.farm.saas.modules.platform.service.PlatformTenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformTenantServiceImpl implements PlatformTenantService {

    private final TenantRepository tenantRepository;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public TenantDetailResponse createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsByCode(request.getCode())) {
            throw new BusinessException("TENANT_CODE_ALREADY_EXISTS", "Mã khách thuê đã tồn tại: " + request.getCode());
        }
        if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
            throw new BusinessException("SUBDOMAIN_ALREADY_EXISTS", "Subdomain đã tồn tại: " + request.getSubdomain());
        }
        if (request.getValidTo().isBefore(request.getValidFrom())) {
            throw new BusinessException("INVALID_DATE_RANGE", "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }

        // 1. Tạo Tenant
        Tenant tenant = Tenant.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .subdomain(request.getSubdomain().trim().toLowerCase())
                .status("ACTIVE")
                .subscriptionPlan(request.getPlanType())
                .build();
        tenant = tenantRepository.save(tenant);

        // 2. Tạo TenantSubscription
        TenantSubscription subscription = TenantSubscription.builder()
                .tenantId(tenant.getId())
                .planType(request.getPlanType())
                .maxFarms(request.getMaxFarms())
                .maxUsers(request.getMaxUsers())
                .validFrom(request.getValidFrom() != null ? request.getValidFrom().atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : java.time.Instant.now())
                .validTo(request.getValidTo() != null ? request.getValidTo().atTime(java.time.LocalTime.MAX).atZone(java.time.ZoneOffset.UTC).toInstant() : java.time.Instant.now().plus(java.time.Duration.ofDays(365)))
                .isActive(true)
                .build();
        subscriptionRepository.save(subscription);

        // 3. Tạo Enterprise
        Enterprise enterprise = Enterprise.builder()
                .tenantId(tenant.getId())
                .contactEmail(request.getAdminEmail())
                .build();
        enterpriseRepository.save(enterprise);

        // 4. Tạo tài khoản ROLE_FARM_OWNER ban đầu
        Role farmOwnerRole = roleRepository.findAll().stream()
                .filter(r -> "ROLE_FARM_OWNER".equals(r.getCode()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Role", "ROLE_FARM_OWNER"));

        String rawPassword = request.getAdminPassword() != null && !request.getAdminPassword().isBlank()
                ? request.getAdminPassword()
                : "Password@2026";

        User adminUser = User.builder()
                .tenantId(tenant.getId())
                .isSuperAdmin(false)
                .username(request.getAdminEmail())
                .email(request.getAdminEmail())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(request.getAdminFullName())
                .status("ACTIVE")
                .mustChangePassword(true)
                .failedLogins(0)
                .build();
        adminUser = userRepository.save(adminUser);

        UserRole userRole = UserRole.builder()
                .tenantId(tenant.getId())
                .userId(adminUser.getId())
                .roleId(farmOwnerRole.getId())
                .farmId(null)
                .build();
        userRoleRepository.save(userRole);

        // 5. Audit log
        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenant.getId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_TENANT")
                .module("PLATFORM")
                .endpoint("/api/v1/platform/tenants")
                .method("POST")
                .newValue("Tenant ID: " + tenant.getId() + ", Code: " + tenant.getCode())
                .build());

        return toTenantDetailResponse(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantDetailResponse> getTenants(String status, String keyword, Pageable pageable) {
        Page<Tenant> page = tenantRepository.searchTenants(status, keyword, pageable);
        return page.map(this::toTenantDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantDetailResponse getTenantById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));
        return toTenantDetailResponse(tenant);
    }

    @Override
    @Transactional
    public TenantDetailResponse updateTenantStatus(Long id, UpdateTenantStatusRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));

        String oldStatus = tenant.getStatus();
        tenant.setStatus(request.getStatus());
        tenant = tenantRepository.saveAndFlush(tenant);

        // Nếu chuyển sang SUSPENDED hoặc INACTIVE -> thu hồi toàn bộ refresh token
        if ("SUSPENDED".equals(request.getStatus()) || "INACTIVE".equals(request.getStatus())) {
            jdbcTemplate.update(
                    "UPDATE refresh_tokens rt JOIN users u ON rt.user_id = u.id " +
                            "SET rt.revoked = TRUE, rt.revoked_at = NOW() " +
                            "WHERE u.tenant_id = ? AND rt.revoked = FALSE",
                    id
            );
            log.info("Revoked all active refresh tokens for tenant {} due to status change to {}", id, request.getStatus());
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenant.getId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_TENANT_STATUS")
                .module("PLATFORM")
                .endpoint("/api/v1/platform/tenants/" + id + "/status")
                .method("PUT")
                .oldValue(oldStatus)
                .newValue(request.getStatus())
                .build());

        return toTenantDetailResponse(tenant);
    }

    @Override
    @Transactional
    public TenantDetailResponse addSubscription(Long id, CreateSubscriptionRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));

        if (request.getValidTo().isBefore(request.getValidFrom())) {
            throw new BusinessException("INVALID_DATE_RANGE", "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }

        // Tắt gói cũ
        jdbcTemplate.update("UPDATE tenant_subscriptions SET is_active = FALSE WHERE tenant_id = ?", id);

        TenantSubscription subscription = TenantSubscription.builder()
                .tenantId(tenant.getId())
                .planType(request.getPlanType())
                .maxFarms(request.getMaxFarms())
                .maxUsers(request.getMaxUsers())
                .validFrom(request.getValidFrom() != null ? request.getValidFrom().atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : java.time.Instant.now())
                .validTo(request.getValidTo() != null ? request.getValidTo().atTime(java.time.LocalTime.MAX).atZone(java.time.ZoneOffset.UTC).toInstant() : java.time.Instant.now().plus(java.time.Duration.ofDays(365)))
                .isActive(true)
                .build();
        subscriptionRepository.save(subscription);

        tenant.setSubscriptionPlan(request.getPlanType());
        tenant = tenantRepository.save(tenant);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenant.getId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPGRADE_SUBSCRIPTION")
                .module("PLATFORM")
                .endpoint("/api/v1/platform/tenants/" + id + "/subscriptions")
                .method("POST")
                .newValue("Plan: " + request.getPlanType() + ", MaxFarms: " + request.getMaxFarms() + ", MaxUsers: " + request.getMaxUsers())
                .build());

        return toTenantDetailResponse(tenant);
    }

    private TenantDetailResponse toTenantDetailResponse(Tenant tenant) {
        TenantSubscription activeSub = subscriptionRepository.findByTenantIdAndIsActiveTrue(tenant.getId())
                .orElse(null);

        TenantDetailResponse.SubscriptionDto subDto = null;
        if (activeSub != null) {
            java.time.Instant now = java.time.Instant.now();
            long remaining = java.time.temporal.ChronoUnit.DAYS.between(now, activeSub.getValidTo());
            boolean isExpired = now.isAfter(activeSub.getValidTo());

            subDto = TenantDetailResponse.SubscriptionDto.builder()
                    .id(activeSub.getId())
                    .planType(activeSub.getPlanType())
                    .maxFarms(activeSub.getMaxFarms())
                    .maxUsers(activeSub.getMaxUsers())
                    .validFrom(activeSub.getValidFrom() != null ? activeSub.getValidFrom().atZone(java.time.ZoneOffset.UTC).toLocalDate() : null)
                    .validTo(activeSub.getValidTo() != null ? activeSub.getValidTo().atZone(java.time.ZoneOffset.UTC).toLocalDate() : null)
                    .remainingDays(remaining > 0 ? remaining : 0)
                    .isExpired(isExpired)
                    .isActive(Boolean.TRUE.equals(activeSub.getIsActive()))
                    .build();
        }

        Long totalFarms = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM farms WHERE tenant_id = ?", Long.class, tenant.getId());
        Long totalUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ?", Long.class, tenant.getId());

        TenantDetailResponse.UsageDto usageDto = TenantDetailResponse.UsageDto.builder()
                .totalFarms(totalFarms != null ? totalFarms : 0L)
                .totalUsers(totalUsers != null ? totalUsers : 0L)
                .build();

        return TenantDetailResponse.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .subdomain(tenant.getSubdomain())
                .status(tenant.getStatus())
                .subscriptionPlan(tenant.getSubscriptionPlan())
                .activeSubscription(subDto)
                .currentUsage(usageDto)
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
