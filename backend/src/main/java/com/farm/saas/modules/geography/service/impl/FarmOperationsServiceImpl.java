package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.repository.BudgetRepository;
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
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
    private final EmployeeRepository employeeRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final BudgetRepository budgetRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_ROLES_IN_FARM = Set.of(
            "FARM_MANAGER", "ZONE_MANAGER", "ZONE_LEADER", "TECHNICAL_LEAD",
            "AGRONOMIST", "VETERINARIAN", "WAREHOUSE_KEEPER", "ACCOUNTANT",
            "FIELD_WORKER", "DEPUTY_MANAGER", "GUARDS_SECURITY"
    );

    private static final Set<String> VALID_CYCLE_STATUSES = Set.of(
            "PLANNING", "ACTIVE", "CLOSED"
    );

    @Override
    @Transactional(readOnly = true)
    public List<FarmAssignmentResponse> getAssignments(Long farmId) {
        Farm farm = getFarmOrThrow(farmId);
        List<FarmAssignment> assignments = farmAssignmentRepository.findByFarmIdAndIsActiveTrue(farmId);
        List<FarmAssignmentResponse> result = assignments.stream()
                .map(a -> toAssignmentResponse(a, farm.getName()))
                .collect(Collectors.toList());

        // Bổ sung nhân sự không có tài khoản SaaS nhưng đã được gán vào phân khu (qua department)
        List<Employee> nonUserEmployees = employeeRepository.findByTenantIdAndFarmIdOrderByCreatedAtDesc(farm.getTenantId(), farmId)
                .stream()
                .filter(e -> e.getUserId() == null && "ACTIVE".equalsIgnoreCase(e.getStatus()) && StringUtils.hasText(e.getDepartment()))
                .collect(Collectors.toList());

        if (!nonUserEmployees.isEmpty()) {
            List<ProductionZone> zones = productionZoneRepository.findByFarmId(farmId);
            for (Employee emp : nonUserEmployees) {
                Long zoneId = null;
                String zoneName = null;
                for (ProductionZone z : zones) {
                    if (emp.getDepartment().toLowerCase().contains(z.getName().toLowerCase())) {
                        zoneId = z.getId();
                        zoneName = z.getName();
                        break;
                    }
                }
                if (zoneId != null) {
                    result.add(FarmAssignmentResponse.builder()
                            .id(-emp.getId())
                            .tenantId(farm.getTenantId())
                            .farmId(farmId)
                            .farmName(farm.getName())
                            .zoneId(zoneId)
                            .zoneName(zoneName)
                            .userId(null)
                            .employeeId(emp.getId())
                            .username(null)
                            .userFullName(emp.getFullName())
                            .department(emp.getDepartment())
                            .position(emp.getPosition() != null ? emp.getPosition() : "FIELD_WORKER")
                            .employeeCode(emp.getEmployeeCode())
                            .roleInFarm(emp.getPosition() != null ? emp.getPosition() : "FIELD_WORKER")
                            .assignedFrom(emp.getJoinedDate() != null ? emp.getJoinedDate() : LocalDate.now())
                            .assignedTo(null)
                            .isActive(true)
                            .createdAt(emp.getCreatedAt() != null ? emp.getCreatedAt() : Instant.now())
                            .build());
                }
            }
        }

        return result;
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

        User user = null;
        Employee employee = null;

        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (userOpt.isPresent()) {
            user = userOpt.get();
            employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        } else {
            // Trường hợp client truyền ID của bản ghi Employee
            Optional<Employee> empOpt = employeeRepository.findById(request.getUserId());
            if (empOpt.isPresent()) {
                employee = empOpt.get();
                if (employee.getUserId() != null) {
                    user = userRepository.findById(employee.getUserId()).orElse(null);
                }
            }
        }

        if (user == null && employee == null) {
            throw new ResourceNotFoundException("Người dùng", request.getUserId());
        }

        // CÔ LẬP TUYỆT ĐỐI THEO TRANG TRẠI:
        // Kiểm tra nhân viên được chọn bắt buộc phải có employee.getFarmId().equals(farmId),
        // nếu thuộc trang trại khác thì ném ngay BusinessException("EMPLOYEE_BELONGS_TO_ANOTHER_FARM") (HTTP 400).
        if (employee != null) {
            if (employee.getFarmId() != null && !employee.getFarmId().equals(farmId)) {
                throw new BusinessException("EMPLOYEE_BELONGS_TO_ANOTHER_FARM",
                        String.format("Nhân viên %s (%s) thuộc trang trại khác, không thể phân công vào trang trại này.",
                                employee.getFullName(), employee.getEmployeeCode()));
            }
            if (employee.getFarmId() == null) {
                employee.setFarmId(farmId);
                employeeRepository.save(employee);
            }
        }

        if (request.getZoneId() != null) {
            productionZoneRepository.findByFarmIdAndId(farmId, request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân khu", request.getZoneId()));
        }

        // XỬ LÝ PHƯƠNG ÁN 2: Nhân sự thời vụ / nhân viên không có tài khoản SaaS (user == null)
        if (user == null && employee != null) {
            String zoneName = null;
            if (request.getZoneId() != null) {
                ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, request.getZoneId()).orElse(null);
                if (zone != null) {
                    employee.setDepartment("Phân khu: " + zone.getName());
                    zoneName = zone.getName();
                }
            } else {
                employee.setDepartment(com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl.inferDepartmentFromPosition(employee.getPosition()));
            }
            if (StringUtils.hasText(role)) {
                employee.setPosition(role);
            }
            employee.setFarmId(farmId);
            Employee savedEmp = employeeRepository.save(employee);

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .tenantId(farm.getTenantId())
                    .userId(SecurityUtils.getCurrentUserId())
                    .action("ASSIGN_EMPLOYEE_ZONE")
                    .module("GEOGRAPHY")
                    .endpoint("/api/v1/farms/" + farmId + "/assignments")
                    .method("POST")
                    .newValue("Employee: " + savedEmp.getFullName() + ", Zone: " + zoneName + ", Role: " + role)
                    .build());

            return FarmAssignmentResponse.builder()
                    .id(-savedEmp.getId())
                    .tenantId(farm.getTenantId())
                    .farmId(farmId)
                    .farmName(farm.getName())
                    .zoneId(request.getZoneId())
                    .zoneName(zoneName)
                    .userId(null)
                    .employeeId(savedEmp.getId())
                    .username(null)
                    .userFullName(savedEmp.getFullName())
                    .department(savedEmp.getDepartment())
                    .position(savedEmp.getPosition())
                    .employeeCode(savedEmp.getEmployeeCode())
                    .roleInFarm(role)
                    .assignedFrom(request.getAssignedFrom() != null ? request.getAssignedFrom() : LocalDate.now())
                    .assignedTo(request.getAssignedTo())
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build();
        }

        Long targetUserId = user != null ? user.getId() : (employee != null && employee.getUserId() != null ? employee.getUserId() : request.getUserId());

        // Tập hợp danh sách User IDs / Employee IDs có thể đại diện cho nhân sự này
        Set<Long> candidateUserIds = new HashSet<>();
        if (targetUserId != null) candidateUserIds.add(targetUserId);
        if (user != null) candidateUserIds.add(user.getId());
        if (employee != null) {
            if (employee.getUserId() != null) candidateUserIds.add(employee.getUserId());
            if (employee.getId() != null) candidateUserIds.add(employee.getId());
        }

        // Tìm kiếm các phân công đang active của nhân sự này tại trang trại
        List<FarmAssignment> existingActive = new ArrayList<>();
        for (Long uid : candidateUserIds) {
            farmAssignmentRepository.findByUserIdAndIsActiveTrue(uid).stream()
                    .filter(fa -> Objects.equals(fa.getFarmId(), farmId))
                    .forEach(existingActive::add);
        }

        FarmAssignment assignment;
        if (!existingActive.isEmpty()) {
            // CẬP NHẬT TRỰC TIẾP VÀO BẢN GHI ĐANG HOẠT ĐỘNG, TUYỆT ĐỐI KHÔNG TẠO BẢN GHI MỚI TRÙNG LẶP
            assignment = existingActive.get(0);
            assignment.setZoneId(request.getZoneId());
            assignment.setRoleInFarm(role);
            if (request.getAssignedFrom() != null) {
                assignment.setAssignedFrom(request.getAssignedFrom());
            }
            assignment.setAssignedTo(request.getAssignedTo());
            assignment.setIsActive(true);
            assignment.setUpdatedAt(Instant.now());
            assignment.setUpdatedBy(SecurityUtils.getCurrentUserId());

            // Vô hiệu hóa dọn sạch nếu trước đó có bản ghi dư thừa khác
            for (int i = 1; i < existingActive.size(); i++) {
                FarmAssignment dup = existingActive.get(i);
                dup.setIsActive(false);
                dup.setAssignedTo(LocalDate.now());
                dup.setUpdatedAt(Instant.now());
                dup.setUpdatedBy(SecurityUtils.getCurrentUserId());
                farmAssignmentRepository.save(dup);
            }
        } else {
            assignment = FarmAssignment.builder()
                    .tenantId(farm.getTenantId())
                    .farmId(farmId)
                    .zoneId(request.getZoneId())
                    .userId(targetUserId)
                    .roleInFarm(role)
                    .assignedFrom(request.getAssignedFrom() != null ? request.getAssignedFrom() : LocalDate.now())
                    .assignedTo(request.getAssignedTo())
                    .isActive(true)
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
        }

        FarmAssignment saved = farmAssignmentRepository.save(assignment);

        // Đồng bộ phân khu phụ trách sang hồ sơ nhân sự (department) nếu có
        final Employee targetEmp = employee;
        if (targetEmp != null && request.getZoneId() != null) {
            productionZoneRepository.findById(request.getZoneId()).ifPresent(pz -> {
                targetEmp.setDepartment("Phân khu: " + pz.getName());
                employeeRepository.save(targetEmp);
            });
        }

        // Đảm bảo cấp quyền truy cập user_farm_access nếu có tài khoản user và chưa có quyền
        if (user != null && !userFarmAccessRepository.existsByUserIdAndFarmId(user.getId(), farmId)) {
            UserFarmAccess access = UserFarmAccess.builder()
                    .userId(user.getId())
                    .farmId(farmId)
                    .tenantId(farm.getTenantId())
                    .grantedAt(Instant.now())
                    .grantedBy(SecurityUtils.getCurrentUserId())
                    .build();
            userFarmAccessRepository.save(access);
        }

        String displayNameForAudit = user != null ? user.getUsername() : (employee != null ? employee.getFullName() : String.valueOf(targetUserId));
        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_FARM_ASSIGNMENT")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/assignments")
                .method("POST")
                .newValue("User: " + displayNameForAudit + ", Role: " + role)
                .build());

        return toAssignmentResponse(saved, farm.getName());
    }

    @Override
    @Transactional
    public void deleteAssignment(Long farmId, Long assignmentId) {
        deleteAssignment(farmId, assignmentId, null);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long farmId, Long assignmentId, Long employeeId) {
        Farm farm = getFarmOrThrow(farmId);

        // Trường hợp 1: ID âm hoặc không có assignmentId -> Phân công ảo của nhân sự thời vụ / không có user account
        if ((assignmentId != null && assignmentId < 0) || (assignmentId == null && employeeId != null)) {
            Long targetEmpId = employeeId != null ? employeeId : -assignmentId;
            employeeRepository.findById(targetEmpId).ifPresent(emp -> {
                emp.setDepartment(com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl.inferDepartmentFromPosition(emp.getPosition()));
                employeeRepository.save(emp);
            });
        } else {
            // Trường hợp 2: ID phân công thực tế trong bảng farm_assignments
            Optional<FarmAssignment> assignmentOpt = farmAssignmentRepository.findByFarmIdAndId(farmId, assignmentId);
            if (assignmentOpt.isPresent()) {
                FarmAssignment assignment = assignmentOpt.get();
                assignment.setIsActive(false);
                if (assignment.getAssignedTo() == null || assignment.getAssignedTo().isAfter(java.time.LocalDate.now())) {
                    assignment.setAssignedTo(java.time.LocalDate.now());
                }
                assignment.setUpdatedAt(Instant.now());
                assignment.setUpdatedBy(SecurityUtils.getCurrentUserId());
                farmAssignmentRepository.save(assignment);

                // Đồng bộ cập nhật hồ sơ nhân sự về bộ phận mặc định
                Optional<Employee> empToReset = Optional.empty();
                if (employeeId != null) {
                    empToReset = employeeRepository.findById(employeeId);
                }
                if (empToReset.isEmpty() && assignment.getUserId() != null) {
                    empToReset = employeeRepository.findByUserId(assignment.getUserId());
                }
                empToReset.ifPresent(emp -> {
                    emp.setDepartment(com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl.inferDepartmentFromPosition(emp.getPosition()));
                    employeeRepository.save(emp);
                });
            } else {
                // Dự phòng: thử tìm theo employeeId
                Optional<Employee> empOpt = employeeRepository.findById(assignmentId);
                if (empOpt.isPresent()) {
                    Employee emp = empOpt.get();
                    emp.setDepartment(com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl.inferDepartmentFromPosition(emp.getPosition()));
                    employeeRepository.save(emp);
                } else {
                    throw new ResourceNotFoundException("Phân công", assignmentId);
                }
            }
        }

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
    @Transactional
    public void deleteCycle(Long farmId, Long cycleId) {
        Farm farm = getFarmOrThrow(farmId);
        OperationalCycle cycle = operationalCycleRepository.findByFarmIdAndId(farmId, cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Chu kỳ vận hành", cycleId));

        boolean hasSeasons = cropSeasonRepository.existsByOperationalCycleId(cycleId);
        boolean hasLivestock = livestockGroupRepository.existsByOperationalCycleId(cycleId);
        boolean hasBudgets = budgetRepository.existsByOperationalCycleId(cycleId);

        if (hasSeasons || hasLivestock || hasBudgets) {
            cycle.setStatus("CLOSED");
            cycle.setUpdatedAt(Instant.now());
            cycle.setUpdatedBy(SecurityUtils.getCurrentUserId());
            operationalCycleRepository.save(cycle);

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .tenantId(farm.getTenantId())
                    .userId(SecurityUtils.getCurrentUserId())
                    .action("CLOSE_OPERATIONAL_CYCLE")
                    .module("GEOGRAPHY")
                    .endpoint("/api/v1/farms/" + farmId + "/cycles/" + cycleId)
                    .method("DELETE")
                    .newValue("Cycle closed due to existing transactions: " + cycle.getName())
                    .build());
        } else {
            operationalCycleRepository.delete(cycle);

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .tenantId(farm.getTenantId())
                    .userId(SecurityUtils.getCurrentUserId())
                    .action("DELETE_OPERATIONAL_CYCLE")
                    .module("GEOGRAPHY")
                    .endpoint("/api/v1/farms/" + farmId + "/cycles/" + cycleId)
                    .method("DELETE")
                    .newValue("Physically deleted cycle: " + cycle.getName())
                    .build());
        }
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
        String department = null;
        String position = null;
        String employeeCode = null;
        Long employeeId = null;

        Optional<User> uOpt = userRepository.findById(a.getUserId());
        if (uOpt.isPresent()) {
            username = uOpt.get().getUsername();
            userFullName = uOpt.get().getFullName();
        }

        Optional<com.farm.saas.modules.hr.entity.Employee> empOpt = employeeRepository.findByUserId(a.getUserId());
        if (empOpt.isEmpty()) {
            empOpt = employeeRepository.findById(a.getUserId());
        }
        if (empOpt.isPresent()) {
            com.farm.saas.modules.hr.entity.Employee emp = empOpt.get();
            employeeId = emp.getId();
            department = emp.getDepartment();
            position = emp.getPosition();
            employeeCode = emp.getEmployeeCode();
            if (userFullName == null || userFullName.isBlank()) {
                userFullName = emp.getFullName();
            }
            if (username == null || username.isBlank()) {
                username = emp.getEmployeeCode();
            }
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
                .employeeId(employeeId)
                .username(username)
                .userFullName(userFullName)
                .department(department)
                .position(position)
                .employeeCode(employeeCode)
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
