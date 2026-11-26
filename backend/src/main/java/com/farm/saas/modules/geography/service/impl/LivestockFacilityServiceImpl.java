package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.geography.dto.request.CreateLivestockFacilityRequest;
import com.farm.saas.modules.geography.dto.response.LivestockFacilityResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.UserFarmAccessRepository;
import com.farm.saas.modules.geography.service.LivestockFacilityService;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.platform.entity.Tenant;
import com.farm.saas.modules.platform.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestockFacilityServiceImpl implements LivestockFacilityService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final WarehouseRepository warehouseRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<LivestockFacilityResponse> getMyFacilities() {
        Long userId = SecurityUtils.getCurrentUserId();
        Set<Long> farmIds = new LinkedHashSet<>();

        farmRepository.findByManagerUserId(userId).forEach(f -> farmIds.add(f.getId()));
        userFarmAccessRepository.findByUserId(userId).forEach(a -> farmIds.add(a.getFarmId()));
        userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> ur.getFarmId() != null)
                .forEach(ur -> farmIds.add(ur.getFarmId()));

        if (farmIds.isEmpty()) {
            return Collections.emptyList();
        }

        return farmRepository.findAllById(farmIds).stream()
                .filter(f -> !"DELETED".equalsIgnoreCase(f.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LivestockFacilityResponse> searchFacilities(String query) {
        String searchTerm = query != null ? query.trim().toLowerCase() : "";
        return farmRepository.findAll().stream()
                .filter(f -> !"DELETED".equalsIgnoreCase(f.getStatus()))
                .filter(f -> searchTerm.isEmpty()
                        || (f.getName() != null && f.getName().toLowerCase().contains(searchTerm))
                        || (f.getCode() != null && f.getCode().toLowerCase().contains(searchTerm))
                        || (f.getProvince() != null && f.getProvince().toLowerCase().contains(searchTerm))
                        || (f.getBusinessName() != null && f.getBusinessName().toLowerCase().contains(searchTerm)))
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void joinFacility(Long farmId, String notes) {
        Long userId = SecurityUtils.getCurrentUserId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Không tìm thấy cơ sở chăn nuôi"));

        jdbcTemplate.update(
                "INSERT INTO facility_join_requests (tenant_id, farm_id, user_id, requested_role, status, notes) VALUES (?, ?, ?, 'BARN_WORKER', 'PENDING', ?)",
                farm.getTenantId(), farmId, userId, notes
        );
        log.info("User {} gửi yêu cầu tham gia trang trại {}", userId, farmId);
    }

    @Override
    @Transactional
    public LivestockFacilityResponse createDemoFacility(CreateLivestockFacilityRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng hiện tại"));

        // 1. Đảm bảo Tenant tồn tại
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            String tenantCode = "TNT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            String subdomain = request.getManagementDomain() != null
                    ? request.getManagementDomain().replace("https://id.farmgo.vn/", "").replaceAll("[^a-zA-Z0-9-]", "")
                    : tenantCode.toLowerCase();
            if (subdomain.isBlank()) {
                subdomain = tenantCode.toLowerCase();
            }

            Tenant newTenant = Tenant.builder()
                    .code(tenantCode)
                    .name(request.getBusinessName().trim())
                    .subdomain(subdomain)
                    .subscriptionPlan("STANDARD")
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            newTenant = tenantRepository.save(newTenant);
            tenantId = newTenant.getId();

            currentUser.setTenantId(tenantId);
            userRepository.save(currentUser);
        }

        // 2. Tạo Farm (Cơ sở chăn nuôi)
        String farmCode = "FAC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String fullAddress = (request.getWard() != null ? request.getWard() + ", " : "")
                + (request.getProvince() != null ? request.getProvince() : "Việt Nam");

        Farm farm = Farm.builder()
                .tenantId(tenantId)
                .code(farmCode)
                .name(request.getBusinessName().trim())
                .farmType("LIVESTOCK")
                .totalAreaM2(BigDecimal.valueOf(5000))
                .address(fullAddress)
                .province(request.getProvince())
                .ward(request.getWard())
                .facilityType(request.getFacilityType())
                .businessName(request.getBusinessName().trim())
                .taxCode(request.getTaxCode())
                .managementDomain(request.getManagementDomain())
                .livestockSector(request.getLivestockSector())
                .livestockType(request.getLivestockType())
                .subscriptionTier(request.getSubscriptionTier() != null ? request.getSubscriptionTier() : "STANDARD")
                .managerAccountsCount(request.getManagerAccountsCount() != null ? request.getManagerAccountsCount() : 1)
                .subscriptionDurationYears(request.getSubscriptionDurationYears() != null ? request.getSubscriptionDurationYears() : 1)
                .isDemo(true)
                .demoExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .managerUserId(userId)
                .geofenceRadiusM(300)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(userId)
                .build();
        farm = farmRepository.save(farm);

        // 3. Cấp quyền Chủ trang trại (ROLE_FARM_OWNER) cho người dùng
        Role ownerRole = roleRepository.findByCode("ROLE_FARM_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("ROLE_FARM_OWNER")
                        .name("Chủ trang trại (Quản trị viên cao nhất)")
                        .scopeLevel("TENANT")
                        .createdAt(Instant.now())
                        .build()));

        userRoleRepository.save(UserRole.builder()
                .tenantId(tenantId)
                .userId(userId)
                .roleId(ownerRole.getId())
                .farmId(farm.getId())
                .assignedAt(Instant.now())
                .assignedBy(userId)
                .build());

        userFarmAccessRepository.save(UserFarmAccess.builder()
                .tenantId(tenantId)
                .userId(userId)
                .farmId(farm.getId())
                .grantedAt(Instant.now())
                .grantedBy(userId)
                .build());

        // 4. Khởi tạo dữ liệu mẫu Chăn nuôi (Seed Demo Data)
        // Khu chuồng nuôi A1
        ProductionZone zone = ProductionZone.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .code("ZONE-A1")
                .name("Dãy Chuồng Nuôi A1 - Công Nghệ Cao")
                .zoneType("LIVESTOCK_BARN")
                .areaM2(BigDecimal.valueOf(1200))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(userId)
                .build();
        zone = productionZoneRepository.save(zone);

        // Giống vật nuôi
        boolean isPig = !"POULTRY".equalsIgnoreCase(request.getLivestockSector()) && !"POULTRY_MEAT".equalsIgnoreCase(request.getLivestockType());
        String species = isPig ? "PIG" : "POULTRY";
        String breedName = isPig ? "Heo Siêu Nạc CP 3 Máu" : "Gà Ri Thả Vườn Dabaco";

        final Long currentTenantId = tenantId;
        LivestockBreed breed = livestockBreedRepository.findByTenantIdAndSpecies(tenantId, species).stream()
                .findFirst()
                .orElseGet(() -> livestockBreedRepository.save(LivestockBreed.builder()
                        .tenantId(currentTenantId)
                        .species(species)
                        .breedName(breedName)
                        .standardGrowthDays(isPig ? 150 : 90)
                        .targetWeightKg(BigDecimal.valueOf(isPig ? 110.0 : 2.5))
                        .managementType("GROUP")
                        .createdAt(Instant.now())
                        .createdBy(userId)
                        .build()));

        // Đàn nuôi thử nghiệm 50 con
        LivestockGroup group = LivestockGroup.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .zoneId(zone.getId())
                .groupCode(isPig ? "LOT-HEO-01" : "LOT-GA-01")
                .breedId(breed.getId())
                .initialQuantity(50)
                .currentQuantity(50)
                .avgInitialWeightKg(BigDecimal.valueOf(isPig ? 25.0 : 0.5))
                .unitPrice(BigDecimal.valueOf(isPig ? 1800000 : 35000))
                .totalCost(BigDecimal.valueOf(isPig ? 90000000 : 1750000))
                .entryDate(LocalDate.now().minusDays(15))
                .managementType("GROUP")
                .status("ACTIVE")
                .origin("Trại giống Quốc tế CP")
                .notes("Đàn nuôi thử nghiệm hệ thống quản lý số")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(userId)
                .build();
        livestockGroupRepository.save(group);

        // Kho vật tư & cám chuồng A1
        Warehouse warehouse = Warehouse.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .code("WH-FEED-01")
                .name("Kho Cám & Thuốc Thú Y Chuồng A1")
                .warehouseType("FEED")
                .capacityM3(BigDecimal.valueOf(500))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(userId)
                .build();
        warehouseRepository.save(warehouse);

        log.info("Khởi tạo thành công Cơ sở chăn nuôi demo: ID={}, Code={}, Name={}, User={}", farm.getId(), farm.getCode(), farm.getName(), userId);

        return toResponse(farm);
    }

    private LivestockFacilityResponse toResponse(Farm f) {
        return LivestockFacilityResponse.builder()
                .id(f.getId())
                .tenantId(f.getTenantId())
                .code(f.getCode())
                .name(f.getName())
                .facilityType(f.getFacilityType())
                .businessName(f.getBusinessName() != null ? f.getBusinessName() : f.getName())
                .taxCode(f.getTaxCode())
                .managementDomain(f.getManagementDomain())
                .livestockSector(f.getLivestockSector())
                .livestockType(f.getLivestockType())
                .province(f.getProvince())
                .ward(f.getWard())
                .address(f.getAddress())
                .status(f.getStatus())
                .isDemo(f.getIsDemo())
                .demoExpiresAt(f.getDemoExpiresAt())
                .subscriptionTier(f.getSubscriptionTier())
                .managerAccountsCount(f.getManagerAccountsCount())
                .subscriptionDurationYears(f.getSubscriptionDurationYears())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
