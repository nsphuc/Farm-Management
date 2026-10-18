package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest;
import com.farm.saas.modules.geography.dto.request.CreateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmSettingsRequest;
import com.farm.saas.modules.geography.dto.request.UpdateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.response.FarmAssignmentResponse;
import com.farm.saas.modules.geography.dto.response.FarmOperationalSettingResponse;
import com.farm.saas.modules.geography.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.geography.entity.*;
import com.farm.saas.modules.geography.repository.*;
import com.farm.saas.modules.geography.service.FarmOperationsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmOperationsServiceImpl implements FarmOperationsService {

    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final OperationalCycleRepository operationalCycleRepository;
    private final FarmOperationalSettingRepository farmOperationalSettingRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_ROLES_IN_FARM = Set.of(
            "FARM_MANAGER", "DEPUTY_MANAGER", "AGRONOMIST", "VETERINARIAN",
            "ZONE_LEADER", "FIELD_WORKER", "GUARDS_SECURITY"
    );

    private static final Set<String> VALID_CYCLE_STATUSES = Set.of(
            "PLANNING", "ACTIVE", "CLOSED"
    );

    @Override
    @Transactional(readOnly = true)
    public List<FarmAssignmentResponse> getAssignments(Long farmId) {
        Farm farm = getFarmOrThrow(farmId);
        List<FarmAssignment> assignments = farmAssignmentRepository.findByFarmId(farmId);
        return assignments.stream()
                .map(a -> toAssignmentResponse(a, farm.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FarmAssignmentResponse createAssignment(Long farmId, CreateFarmAssignmentRequest request) {
        Farm farm = getFarmOrThrow(farmId);

        String role = request.getRoleInFarm().toUpperCase();
        if (!VALID_ROLES_IN_FARM.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE_IN_FARM",
                    "Vai trò phân công không hợp lệ. Cho phép: " + VALID_ROLES_IN_FARM);
        }

        if (request.getAssignedTo() != null && request.getAssignedTo().isBefore(request.getAssignedFrom())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE",
                    "Ngày kết thúc phân công phải lớn hơn hoặc bằng ngày bắt đầu.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", request.getUserId()));

        if (request.getZoneId() != null) {
            productionZoneRepository.findByFarmIdAndId(farmId, request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân khu", request.getZoneId()));
        }

        FarmAssignment assignment = FarmAssignment.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .zoneId(request.getZoneId())
                .userId(request.getUserId())
                .roleInFarm(role)
                .assignedFrom(request.getAssignedFrom())
                .assignedTo(request.getAssignedTo())
                .isActive(true)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        FarmAssignment saved = farmAssignmentRepository.save(assignment);

        // Đảm bảo cấp quyền truy cập user_farm_access nếu chưa có
        if (!userFarmAccessRepository.existsByUserIdAndFarmId(user.getId(), farmId)) {
            UserFarmAccess access = UserFarmAccess.builder()
                    .userId(user.getId())
                    .farmId(farmId)
                    .tenantId(farm.getTenantId())
                    .grantedAt(Instant.now())
                    .grantedBy(SecurityUtils.getCurrentUserId())
                    .build();
            userFarmAccessRepository.save(access);
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_FARM_ASSIGNMENT")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/assignments")
                .method("POST")
                .newValue("User: " + user.getUsername() + ", Role: " + role)
                .build());

        return toAssignmentResponse(saved, farm.getName());
    }

    @Override
    @Transactional
    public void deleteAssignment(Long farmId, Long assignmentId) {
        Farm farm = getFarmOrThrow(farmId);
        FarmAssignment assignment = farmAssignmentRepository.findByFarmIdAndId(farmId, assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân công", assignmentId));

        assignment.setIsActive(false);
        assignment.setUpdatedAt(Instant.now());
        assignment.setUpdatedBy(SecurityUtils.getCurrentUserId());
        farmAssignmentRepository.save(assignment);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("REVOKE_FARM_ASSIGNMENT")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/assignments/" + assignmentId)
                .method("DELETE")
                .newValue("Deactivated assignment: " + assignmentId)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OperationalCycleResponse> getCycles(Long farmId) {
        Farm farm = getFarmOrThrow(farmId);
        List<OperationalCycle> cycles = operationalCycleRepository.findByFarmId(farmId);
        return cycles.stream()
                .map(c -> toCycleResponse(c, farm.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OperationalCycleResponse createCycle(Long farmId, CreateOperationalCycleRequest request) {
        Farm farm = getFarmOrThrow(farmId);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE",
                    "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu.");
        }

        OperationalCycle cycle = OperationalCycle.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .name(request.getName().trim())
                .fiscalYear(request.getFiscalYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        OperationalCycle saved = operationalCycleRepository.save(cycle);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_OPERATIONAL_CYCLE")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/cycles")
                .method("POST")
                .newValue("Cycle: " + saved.getName())
                .build());

        return toCycleResponse(saved, farm.getName());
    }

    @Override
    @Transactional
    public OperationalCycleResponse updateCycle(Long farmId, Long cycleId, UpdateOperationalCycleRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        OperationalCycle cycle = operationalCycleRepository.findByFarmIdAndId(farmId, cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Chu kỳ vận hành", cycleId));

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE",
                        "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu.");
            }
            cycle.setStartDate(request.getStartDate());
            cycle.setEndDate(request.getEndDate());
        }

        if (request.getName() != null) cycle.setName(request.getName().trim());
        if (request.getFiscalYear() != null) cycle.setFiscalYear(request.getFiscalYear());
        if (request.getStatus() != null) {
            String status = request.getStatus().toUpperCase();
            if (!VALID_CYCLE_STATUSES.contains(status)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CYCLE_STATUS", "Trạng thái chu kỳ không hợp lệ.");
            }
            cycle.setStatus(status);
        }

        cycle.setUpdatedAt(Instant.now());
        cycle.setUpdatedBy(SecurityUtils.getCurrentUserId());
        OperationalCycle updated = operationalCycleRepository.save(cycle);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_OPERATIONAL_CYCLE")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/cycles/" + cycleId)
                .method("PUT")
                .newValue("Updated cycle: " + updated.getName())
                .build());

        return toCycleResponse(updated, farm.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public FarmOperationalSettingResponse getSettings(Long farmId) {
        Farm farm = getFarmOrThrow(farmId);
        FarmOperationalSetting settings = farmOperationalSettingRepository.findByFarmId(farmId)
                .orElseGet(() -> FarmOperationalSetting.builder()
                        .tenantId(farm.getTenantId())
                        .farmId(farmId)
                        .irrigationThresholdJson("{}")
                        .workShiftConfigJson("{}")
                        .build());
        return toSettingResponse(settings, farm.getName());
    }

    @Override
    @Transactional
    public FarmOperationalSettingResponse updateSettings(Long farmId, UpdateFarmSettingsRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        FarmOperationalSetting settings = farmOperationalSettingRepository.findByFarmId(farmId)
                .orElseGet(() -> FarmOperationalSetting.builder()
                        .tenantId(farm.getTenantId())
                        .farmId(farmId)
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build());

        if (request.getIrrigationThresholdJson() != null) {
            settings.setIrrigationThresholdJson(request.getIrrigationThresholdJson());
        }
        if (request.getWorkShiftConfigJson() != null) {
            settings.setWorkShiftConfigJson(request.getWorkShiftConfigJson());
        }
        settings.setUpdatedAt(Instant.now());
        settings.setUpdatedBy(SecurityUtils.getCurrentUserId());

        FarmOperationalSetting saved = farmOperationalSettingRepository.save(settings);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_FARM_SETTINGS")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/settings")
                .method("PUT")
                .newValue("Updated settings for farm " + farmId)
                .build());

        return toSettingResponse(saved, farm.getName());
    }

    private Farm getFarmOrThrow(Long farmId) {
        return farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", farmId));
    }

    private FarmAssignmentResponse toAssignmentResponse(FarmAssignment a, String farmName) {
        String username = null;
        String userFullName = null;
        Optional<User> uOpt = userRepository.findById(a.getUserId());
        if (uOpt.isPresent()) {
            username = uOpt.get().getUsername();
            userFullName = uOpt.get().getFullName();
        }

        String zoneName = null;
        if (a.getZoneId() != null) {
            zoneName = productionZoneRepository.findById(a.getZoneId())
                    .map(ProductionZone::getName)
                    .orElse(null);
        }

        return FarmAssignmentResponse.builder()
                .id(a.getId())
                .tenantId(a.getTenantId())
                .farmId(a.getFarmId())
                .farmName(farmName)
                .zoneId(a.getZoneId())
                .zoneName(zoneName)
                .userId(a.getUserId())
                .username(username)
                .userFullName(userFullName)
                .roleInFarm(a.getRoleInFarm())
                .assignedFrom(a.getAssignedFrom())
                .assignedTo(a.getAssignedTo())
                .isActive(Boolean.TRUE.equals(a.getIsActive()))
                .createdAt(a.getCreatedAt())
                .build();
    }

    private OperationalCycleResponse toCycleResponse(OperationalCycle c, String farmName) {
        return OperationalCycleResponse.builder()
                .id(c.getId())
                .tenantId(c.getTenantId())
                .farmId(c.getFarmId())
                .farmName(farmName)
                .name(c.getName())
                .fiscalYear(c.getFiscalYear())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private FarmOperationalSettingResponse toSettingResponse(FarmOperationalSetting s, String farmName) {
        return FarmOperationalSettingResponse.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .farmId(s.getFarmId())
                .farmName(farmName)
                .irrigationThresholdJson(s.getIrrigationThresholdJson())
                .workShiftConfigJson(s.getWorkShiftConfigJson())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
