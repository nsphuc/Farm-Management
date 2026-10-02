package com.farmsaas.modules.farm.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.FarmSummaryResponse;
import com.farmsaas.modules.farm.dto.UpdateFarmRequest;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.FarmOperationalSetting;
import com.farmsaas.modules.farm.repository.FarmAssignmentRepository;
import com.farmsaas.modules.farm.repository.FarmOperationalSettingRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.user.entity.UserFarmAccess;
import com.farmsaas.modules.user.repository.UserFarmAccessRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmServiceImpl implements FarmService {

    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final FarmOperationalSettingRepository farmOperationalSettingRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FarmResponse> getFarms(String keyword, String status, String farmType, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        Page<Farm> page = farmRepository.searchFarms(tenantId, keyword, status, farmType, pageable);

        List<FarmResponse> responses = page.getContent().stream()
                .map(farm -> {
                    long zoneCount = productionZoneRepository.countByFarmIdAndTenantId(farm.getId(), tenantId);
                    return FarmResponse.fromEntity(farm, zoneCount);
                })
                .toList();

        return PageResponse.of(page, responses);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmSummaryResponse> getMyAccessibleFarms() {
        Long tenantId = getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority()));

        List<Farm> farms;
        if (isSuperAdmin) {
            farms = farmRepository.findByTenantId(tenantId);
        } else {
            // Gom danh sách FarmId từ user_farm_access, farm_assignments, và các farm do user làm manager
            Set<Long> accessibleIds = new HashSet<>();
            if (currentUserId != null) {
                userFarmAccessRepository.findByUserIdAndTenantId(currentUserId, tenantId)
                        .forEach(ufa -> accessibleIds.add(ufa.getFarmId()));

                accessibleIds.addAll(farmAssignmentRepository.findFarmIdsByUserIdAndTenantId(currentUserId, tenantId));
            }

            if (accessibleIds.isEmpty()) {
                farms = new ArrayList<>();
            } else {
                farms = farmRepository.findAccessibleFarms(tenantId, new ArrayList<>(accessibleIds), false);
            }
        }

        return farms.stream()
                .map(FarmSummaryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FarmResponse getFarmById(Long id) {
        Long tenantId = getRequiredTenantId();
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Trang trại", id));

        long zoneCount = productionZoneRepository.countByFarmIdAndTenantId(farm.getId(), tenantId);
        return FarmResponse.fromEntity(farm, zoneCount);
    }

    @Override
    @Transactional
    public FarmResponse createFarm(CreateFarmRequest request) {
        Long tenantId = getRequiredTenantId();

        if (farmRepository.existsByTenantIdAndCode(tenantId, request.getCode().trim().toUpperCase())) {
            throw new BusinessException("Mã trang trại '" + request.getCode() + "' đã tồn tại trong tổ chức.");
        }

        Farm farm = Farm.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .farmType(request.getFarmType())
                .totalAreaM2(request.getTotalAreaM2())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress().trim())
                .managerUserId(request.getManagerUserId())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        farm.setTenantId(tenantId);

        Farm saved = farmRepository.save(farm);

        // Khởi tạo cài đặt mặc định cho Farm
        FarmOperationalSetting defaultSetting = FarmOperationalSetting.builder()
                .farmId(saved.getId())
                .irrigationThresholdJson("{\"moisture_min\": 40, \"moisture_max\": 70, \"temp_max\": 35}")
                .workShiftConfigJson("{\"morning\": \"06:00-10:30\", \"afternoon\": \"14:00-17:30\"}")
                .generalSettingsJson("{}")
                .build();
        defaultSetting.setTenantId(tenantId);
        farmOperationalSettingRepository.save(defaultSetting);

        // Tự động cấp quyền user_farm_access cho creator / manager nếu có
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !userFarmAccessRepository.existsByUserIdAndFarmId(currentUserId, saved.getId())) {
            UserFarmAccess access = new UserFarmAccess();
            access.setUserId(currentUserId);
            access.setFarmId(saved.getId());
            access.setTenantId(tenantId);
            access.setGrantedBy("SYSTEM_AUTO");
            userFarmAccessRepository.save(access);
        }

        if (request.getManagerUserId() != null && !request.getManagerUserId().equals(currentUserId)) {
            if (!userFarmAccessRepository.existsByUserIdAndFarmId(request.getManagerUserId(), saved.getId())) {
                UserFarmAccess mgrAccess = new UserFarmAccess();
                mgrAccess.setUserId(request.getManagerUserId());
                mgrAccess.setFarmId(saved.getId());
                mgrAccess.setTenantId(tenantId);
                mgrAccess.setGrantedBy("MANAGER_ASSIGN");
                userFarmAccessRepository.save(mgrAccess);
            }
        }

        log.info("Created new Farm: {} (Code: {}) for tenantId: {}", saved.getName(), saved.getCode(), tenantId);
        return FarmResponse.fromEntity(saved, 0L);
    }

    @Override
    @Transactional
    public FarmResponse updateFarm(Long id, UpdateFarmRequest request) {
        Long tenantId = getRequiredTenantId();
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Trang trại", id));

        farm.setName(request.getName().trim());
        farm.setFarmType(request.getFarmType());
        farm.setTotalAreaM2(request.getTotalAreaM2());
        farm.setLatitude(request.getLatitude());
        farm.setLongitude(request.getLongitude());
        farm.setAddress(request.getAddress().trim());
        farm.setManagerUserId(request.getManagerUserId());
        if (request.getStatus() != null) {
            farm.setStatus(request.getStatus());
        }

        Farm saved = farmRepository.save(farm);

        // Đảm bảo manager có trong user_farm_access
        if (request.getManagerUserId() != null && !userFarmAccessRepository.existsByUserIdAndFarmId(request.getManagerUserId(), saved.getId())) {
            UserFarmAccess mgrAccess = new UserFarmAccess();
            mgrAccess.setUserId(request.getManagerUserId());
            mgrAccess.setFarmId(saved.getId());
            mgrAccess.setTenantId(tenantId);
            mgrAccess.setGrantedBy("MANAGER_UPDATE");
            userFarmAccessRepository.save(mgrAccess);
        }

        long zoneCount = productionZoneRepository.countByFarmIdAndTenantId(saved.getId(), tenantId);
        return FarmResponse.fromEntity(saved, zoneCount);
    }

    @Override
    @Transactional
    public void deleteFarm(Long id) {
        Long tenantId = getRequiredTenantId();
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Trang trại", id));

        farmRepository.delete(farm);
        log.info("Deleted Farm: {} (ID: {}) for tenantId: {}", farm.getName(), id, tenantId);
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
