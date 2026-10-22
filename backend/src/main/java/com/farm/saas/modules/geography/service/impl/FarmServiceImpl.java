package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.dto.request.CreateFarmRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmRequest;
import com.farm.saas.modules.geography.dto.response.FarmDetailResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.FarmOperationalSetting;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.*;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmServiceImpl implements com.farm.saas.modules.geography.service.FarmService {

    private final FarmRepository farmRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final FarmOperationalSettingRepository farmOperationalSettingRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<FarmDetailResponse> getFarms(String farmType, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();

        // Check if user has tenant-wide scope (e.g. ROLE_FARM_OWNER, ROLE_SUPER_ADMIN)
        boolean hasTenantScope = isSuperAdmin || SecurityUtils.getCurrentUser().getRoles().stream()
                .anyMatch(r -> "ROLE_FARM_OWNER".equals(r) || "ROLE_ACCOUNTANT".equals(r));

        Specification<Farm> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (tenantId != null && !isSuperAdmin) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (!hasTenantScope && !isSuperAdmin) {
                if (accessibleFarmIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("id").in(accessibleFarmIds));
                }
            }
            if (farmType != null && !farmType.isBlank()) {
                predicates.add(cb.equal(root.get("farmType"), farmType.toUpperCase()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), pattern),
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("address")), pattern)
                ));
            }
            predicates.add(cb.notEqual(root.get("status"), "DELETED"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Farm> page = farmRepository.findAll(spec, pageable);
        List<FarmDetailResponse> responses = page.getContent().stream()
                .map(this::enrichFarmDetail)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public FarmDetailResponse getFarmById(Long id) {
        Farm farm = findFarmAndCheckTenant(id);
        return enrichFarmDetail(farm);
    }

    @Override
    @Transactional
    public FarmDetailResponse createFarm(CreateFarmRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        // Chốt chặn Hạn mức Gói thuê bao: COUNT(farms) < tenant_subscriptions.max_farms
        if (tenantId != null) {
            TenantSubscription activeSub = tenantSubscriptionRepository.findByTenantIdAndIsActiveTrue(tenantId)
                    .orElse(null);

            if (activeSub != null) {
                long currentFarmsCount = farmRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");
                if (currentFarmsCount >= activeSub.getMaxFarms()) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "SUBSCRIPTION_FARM_LIMIT_EXCEEDED",
                            String.format("Số lượng trang trại đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!",
                                    currentFarmsCount, activeSub.getMaxFarms()));
                }
            }
        }

        if (farmRepository.existsByTenantIdAndCode(tenantId, request.getCode())) {
            throw new ApiException(HttpStatus.CONFLICT, "FARM_CODE_ALREADY_EXISTS", "Mã trang trại đã tồn tại trong hệ thống.");
        }

        if (request.getGeofenceRadiusM() == null || request.getGeofenceRadiusM() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_GEOFENCE_RADIUS", "Bán kính chấm công geofence phải lớn hơn 0.");
        }

        if (request.getTotalAreaM2() == null || request.getTotalAreaM2().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AREA_SIZE", "Tổng diện tích trang trại không hợp lệ.");
        }

        Farm newFarm = Farm.builder()
                .tenantId(tenantId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .farmType(request.getFarmType().toUpperCase())
                .totalAreaM2(request.getTotalAreaM2())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .geofenceRadiusM(request.getGeofenceRadiusM())
                .address(request.getAddress())
                .managerUserId(request.getManagerUserId())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        Farm savedFarm = farmRepository.save(newFarm);

        // Tự động khởi tạo farm_operational_settings (#17) mặc định
        FarmOperationalSetting defaultSettings = FarmOperationalSetting.builder()
                .tenantId(tenantId)
                .farmId(savedFarm.getId())
                .irrigationThresholdJson("{\"autoIssueOnFarmingLog\": true, \"defaultPhiDays\": 14, \"alertExpiryDays\": 30}")
                .workShiftConfigJson("{}")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        farmOperationalSettingRepository.save(defaultSettings);

        // Cấp quyền user_farm_access (#12) cho người tạo nếu có userId
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !userFarmAccessRepository.existsByUserIdAndFarmId(currentUserId, savedFarm.getId())) {
            UserFarmAccess access = UserFarmAccess.builder()
                    .userId(currentUserId)
                    .farmId(savedFarm.getId())
                    .tenantId(tenantId)
                    .grantedAt(Instant.now())
                    .grantedBy(currentUserId)
                    .build();
            userFarmAccessRepository.save(access);
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(currentUserId)
                .action("CREATE_FARM")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms")
                .method("POST")
                .newValue("Farm: " + savedFarm.getCode() + ", Type: " + savedFarm.getFarmType())
                .build());

        return enrichFarmDetail(savedFarm);
    }

    @Override
    @Transactional
    public FarmDetailResponse updateFarm(Long id, UpdateFarmRequest request) {
        Farm farm = findFarmAndCheckTenant(id);

        if (request.getGeofenceRadiusM() == null || request.getGeofenceRadiusM() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_GEOFENCE_RADIUS", "Bán kính chấm công geofence phải lớn hơn 0.");
        }

        if (request.getTotalAreaM2() == null || request.getTotalAreaM2().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AREA_SIZE", "Tổng diện tích trang trại không hợp lệ.");
        }

        farm.setName(request.getName().trim());
        if (request.getFarmType() != null) farm.setFarmType(request.getFarmType().toUpperCase());
        farm.setTotalAreaM2(request.getTotalAreaM2());
        farm.setLatitude(request.getLatitude());
        farm.setLongitude(request.getLongitude());
        farm.setGeofenceRadiusM(request.getGeofenceRadiusM());
        farm.setAddress(request.getAddress());
        if (request.getManagerUserId() != null) farm.setManagerUserId(request.getManagerUserId());
        if (request.getStatus() != null) farm.setStatus(request.getStatus().toUpperCase());
        farm.setUpdatedAt(Instant.now());
        farm.setUpdatedBy(SecurityUtils.getCurrentUserId());

        Farm updatedFarm = farmRepository.save(farm);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_FARM")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + id)
                .method("PUT")
                .newValue("Updated farm: " + updatedFarm.getCode())
                .build());

        return enrichFarmDetail(updatedFarm);
    }

    private Farm findFarmAndCheckTenant(Long id) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", id));

        Long currentTenantId = SecurityUtils.getCurrentTenantId();
        if (currentTenantId != null && !SecurityUtils.isSuperAdmin()) {
            if (!Objects.equals(farm.getTenantId(), currentTenantId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền truy cập trang trại thuộc khách thuê khác.");
            }
        }
        return farm;
    }

    private FarmDetailResponse enrichFarmDetail(Farm farm) {
        String managerFullName = null;
        String managerEmployeeCode = null;
        String managerPhone = null;
        if (farm.getManagerUserId() != null) {
            User mgrUser = userRepository.findById(farm.getManagerUserId()).orElse(null);
            if (mgrUser != null) {
                managerFullName = mgrUser.getFullName();
                managerPhone = mgrUser.getPhone();
            }
            try {
                List<String> codes = jdbcTemplate.query(
                        "SELECT employee_code FROM employee_profiles WHERE user_id = ? LIMIT 1",
                        (rs, rowNum) -> rs.getString("employee_code"),
                        farm.getManagerUserId());
                if (!codes.isEmpty()) {
                    managerEmployeeCode = codes.get(0);
                }
            } catch (Exception ignored) {
            }
        }

        Long activeZonesCount = 0L;
        Long activeEmployeesCount = 0L;
        Long operationalCyclesCount = 0L;

        try {
            Long zc = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM production_zones WHERE farm_id = ? AND status != 'DELETED'",
                    Long.class, farm.getId());
            if (zc != null) activeZonesCount = zc;

            Long ec = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT user_id) FROM user_farm_access WHERE farm_id = ?",
                    Long.class, farm.getId());
            if (ec != null) activeEmployeesCount = ec;

            Long cc = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM operational_cycles WHERE farm_id = ?",
                    Long.class, farm.getId());
            if (cc != null) operationalCyclesCount = cc;
        } catch (Exception ignored) {
        }

        String settingsJson = farmOperationalSettingRepository.findByFarmId(farm.getId())
                .map(FarmOperationalSetting::getIrrigationThresholdJson)
                .orElse("{}");

        return FarmDetailResponse.builder()
                .id(farm.getId())
                .tenantId(farm.getTenantId())
                .code(farm.getCode())
                .name(farm.getName())
                .farmType(farm.getFarmType())
                .totalAreaM2(farm.getTotalAreaM2())
                .latitude(farm.getLatitude())
                .longitude(farm.getLongitude())
                .geofenceRadiusM(farm.getGeofenceRadiusM())
                .address(farm.getAddress())
                .managerUserId(farm.getManagerUserId())
                .managerFullName(managerFullName)
                .managerEmployeeCode(managerEmployeeCode)
                .managerPhone(managerPhone)
                .status(farm.getStatus())
                .activeZonesCount(activeZonesCount)
                .activeEmployeesCount(activeEmployeesCount)
                .operationalCyclesCount(operationalCyclesCount)
                .settings(settingsJson)
                .createdAt(farm.getCreatedAt())
                .build();
    }
}
