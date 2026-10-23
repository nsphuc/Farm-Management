package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.FarmAssignment;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.FarmAssignmentRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.UserFarmAccessRepository;
import com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest;
import com.farm.saas.modules.hr.dto.request.ProvisionAccountRequest;
import com.farm.saas.modules.hr.dto.request.UpdateEmployeeRequest;
import com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.service.EmployeeService;
import com.farm.saas.modules.platform.entity.TenantSubscription;
import com.farm.saas.modules.platform.repository.TenantSubscriptionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.farm.saas.common.security.FarmSecurityEvaluator farmSecurity;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               FarmRepository farmRepository,
                               ProductionZoneRepository productionZoneRepository,
                               UserRepository userRepository,
                               RoleRepository roleRepository,
                               UserRoleRepository userRoleRepository,
                               UserFarmAccessRepository userFarmAccessRepository,
                               FarmAssignmentRepository farmAssignmentRepository,
                               TenantSubscriptionRepository tenantSubscriptionRepository,
                               PasswordEncoder passwordEncoder) {
        this(employeeRepository, farmRepository, productionZoneRepository, userRepository, roleRepository,
                userRoleRepository, userFarmAccessRepository, farmAssignmentRepository, tenantSubscriptionRepository,
                passwordEncoder, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               FarmRepository farmRepository,
                               ProductionZoneRepository productionZoneRepository,
                               UserRepository userRepository,
                               RoleRepository roleRepository,
                               UserRoleRepository userRoleRepository,
                               UserFarmAccessRepository userFarmAccessRepository,
                               FarmAssignmentRepository farmAssignmentRepository,
                               TenantSubscriptionRepository tenantSubscriptionRepository,
                               PasswordEncoder passwordEncoder,
                               @org.springframework.beans.factory.annotation.Autowired(required = false) com.farm.saas.common.security.FarmSecurityEvaluator farmSecurity) {
        this.employeeRepository = employeeRepository;
        this.farmRepository = farmRepository;
        this.productionZoneRepository = productionZoneRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.userFarmAccessRepository = userFarmAccessRepository;
        this.farmAssignmentRepository = farmAssignmentRepository;
        this.tenantSubscriptionRepository = tenantSubscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.farmSecurity = farmSecurity;
    }

    /**
     * Tự động suy diễn phòng ban chuẩn từ chức danh / vị trí công việc.
     */
    public static String inferDepartmentFromPosition(String position) {
        if (!StringUtils.hasText(position)) {
            return "Tổ Sản Xuất Hiện Trường";
        }
        String p = position.trim().toUpperCase();

        // 1. FARM_MANAGER -> "Ban Quản Lý Trang Trại"
        if (p.contains("FARM_MANAGER") || p.contains("GIÁM ĐỐC") || p.contains("GIAM DOC")
                || p.contains("QUẢN LÝ TRANG TRẠI") || p.contains("QUAN LY TRANG TRAI")
                || p.contains("TRƯỞNG TRẠI") || p.contains("TRUONG TRAI")
                || p.contains("DEPUTY_MANAGER") || p.contains("DIRECTOR")
                || p.contains("BAN QUẢN LÝ") || p.contains("BAN QUAN LY")) {
            return "Ban Quản Lý Trang Trại";
        }

        // 2. ZONE_MANAGER, TECHNICAL_STAFF -> "Bộ Phận Kỹ Thuật & Sản Xuất"
        if (p.contains("ZONE_MANAGER") || p.contains("TECHNICAL_STAFF") || p.contains("TECHNICAL_LEAD")
                || p.contains("TRƯỞNG PHÂN KHU") || p.contains("TRUONG PHAN KHU")
                || p.contains("AGRONOMIST") || p.contains("VETERINARIAN")
                || p.contains("KỸ SƯ") || p.contains("KY SU")
                || p.contains("THÚ Y") || p.contains("THU Y")
                || p.contains("KỸ THUẬT") || p.contains("KY THUAT")
                || p.contains("KCS") || p.contains("QA") || p.contains("QC")) {
            return "Bộ Phận Kỹ Thuật & Sản Xuất";
        }

        // 3. WAREHOUSE_STAFF -> "Bộ Phận Kho Vận"
        if (p.contains("WAREHOUSE_STAFF") || p.contains("WAREHOUSE_KEEPER") || p.contains("THỦ KHO") || p.contains("THU KHO")
                || p.contains("KHO") || p.contains("LOGISTICS") || p.contains("BỐC XẾP") || p.contains("BOC XEP")) {
            return "Bộ Phận Kho Vận";
        }

        // 4. ACCOUNTANT -> "Bộ Phận Kế Toán Trang Trại"
        if (p.contains("ACCOUNTANT") || p.contains("KẾ TOÁN") || p.contains("KE TOAN")
                || p.contains("THỦ QUỸ") || p.contains("THU QUY") || p.contains("TÀI CHÍNH") || p.contains("TAI CHINH")) {
            return "Bộ Phận Kế Toán Trang Trại";
        }

        // 5. FIELD_STAFF_ACCOUNT, SEASONAL_NO_ACCOUNT (hoặc các vị trí công nhân) -> "Tổ Sản Xuất Hiện Trường"
        return "Tổ Sản Xuất Hiện Trường";
    }

    private boolean isTenantScopeUser() {
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        return user.isSuperAdmin()
                || user.hasRole("ROLE_SUPER_ADMIN")
                || user.hasRole("ROLE_FARM_OWNER")
                || user.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER")
                || user.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER", "ROLE_ACCOUNTANT");
    }

    @Override
    @Transactional
    public EmployeeDetailResponse createEmployee(CreateEmployeeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean tenantScope = isTenantScopeUser();

        // 1. Age check >= 18
        LocalDate dob = request.getDateOfBirth();
        LocalDate checkDate = request.getJoinedDate() != null ? request.getJoinedDate() : LocalDate.now();
        if (dob != null && ChronoUnit.YEARS.between(dob, checkDate) < 18) {
            log.warn("UNDERAGE_EMPLOYEE violation: dob={} checkDate={}", dob, checkDate);
            throw new BusinessException("UNDERAGE_EMPLOYEE",
                    "Nhân viên chưa đủ 18 tuổi lao động tính đến ngày gia nhập (" + dob + " -> " + checkDate + ")",
                    Map.of("dateOfBirth", "Nhân viên chưa đủ 18 tuổi lao động tính đến ngày gia nhập"));
        }

        // Rào chắn phân quyền trang trại (The Farm Barrier Guard)
        if (!tenantScope) {
            Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();
            if (request.getFarmId() == null) {
                if (accessibleFarmIds != null && accessibleFarmIds.size() == 1) {
                    request.setFarmId(accessibleFarmIds.iterator().next());
                } else {
                    throw new BusinessException("FARM_ID_REQUIRED", "Cán bộ quản lý cơ sở chỉ được tạo nhân sự thuộc trang trại mình phụ trách");
                }
            }
            if (accessibleFarmIds == null || !accessibleFarmIds.contains(request.getFarmId())) {
                throw new AccessDeniedException("Bạn không có quyền tiếp nhận nhân sự cho trang trại ID: " + request.getFarmId());
            }
        }

        if (request.getFarmId() != null) {
            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));
            if (tenantId != null && !farm.getTenantId().equals(tenantId)) {
                throw new BusinessException("FARM_NOT_IN_TENANT", "Trang trại không thuộc tổ chức này");
            }
            if (tenantId == null) {
                tenantId = farm.getTenantId();
            }
        }

        if (employeeRepository.findByTenantIdAndEmployeeCode(tenantId, request.getEmployeeCode()).isPresent()) {
            throw new BusinessException("DUPLICATE_EMPLOYEE_CODE", "Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
        }

        // Chặn trùng Kế toán: Mỗi trại chỉ có tối đa 1 Kế toán đang ACTIVE
        if ("ACCOUNTANT".equalsIgnoreCase(request.getPosition()) && request.getFarmId() != null) {
            boolean activeAccountantExists = employeeRepository.findByTenantIdAndFarmIdOrderByCreatedAtDesc(tenantId, request.getFarmId())
                    .stream()
                    .anyMatch(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()) && "ACCOUNTANT".equalsIgnoreCase(e.getPosition()));
            if (activeAccountantExists) {
                throw new BusinessException("ACTIVE_ACCOUNTANT_ALREADY_EXISTS", "Trang trại này đã có Kế toán đang hoạt động (ACTIVE). Mỗi trang trại chỉ có tối đa 1 Kế toán!");
            }
        }

        ProductionZone assignedZone = null;
        if (request.getAssignedZoneId() != null && request.getFarmId() != null) {
            assignedZone = productionZoneRepository.findById(request.getAssignedZoneId())
                    .filter(z -> Objects.equals(z.getFarmId(), request.getFarmId()))
                    .orElseThrow(() -> new BusinessException("ZONE_NOT_FOUND", "Phân khu được chỉ định không thuộc trang trại này"));
        }

        BigDecimal baseSalary = request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal hourlyRate = request.getHourlyRate() != null ? request.getHourlyRate() : BigDecimal.ZERO;
        BigDecimal leaveQuota = request.getAnnualLeaveQuota() != null ? request.getAnnualLeaveQuota() : new BigDecimal("12.0");

        // Tự động suy diễn phòng ban từ chức vụ hoặc phân khu nếu để trống
        String resolvedDepartment;
        if (StringUtils.hasText(request.getDepartment())) {
            resolvedDepartment = request.getDepartment().trim();
        } else if (assignedZone != null) {
            resolvedDepartment = "Phân khu: " + assignedZone.getName();
        } else {
            resolvedDepartment = inferDepartmentFromPosition(request.getPosition());
        }

        Employee employee = Employee.builder()
                .tenantId(tenantId)
                .farmId(request.getFarmId())
                .employeeCode(request.getEmployeeCode())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .idCardNumber(request.getIdCardNumber())
                .dateOfBirth(request.getDateOfBirth())
                .position(request.getPosition())
                .department(resolvedDepartment)
                .joinedDate(request.getJoinedDate())
                .baseSalary(baseSalary)
                .hourlyRate(hourlyRate)
                .contractType(request.getContractType())
                .annualLeaveQuota(leaveQuota)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        employee = employeeRepository.save(employee);
        log.info("Created employee id={}, code={}, dept={} on tenantId={}", employee.getId(), employee.getEmployeeCode(), employee.getDepartment(), tenantId);

        // HỖ TRỢ CẤP TÀI KHOẢN & BỔ NHIỆM FARM_MANAGER TRONG 1 BƯỚC (ONE-STEP PROVISIONING)
        boolean isOwner = tenantScope;
        boolean isFarmManager = "FARM_MANAGER".equalsIgnoreCase(request.getPosition());
        boolean shouldProvision = Boolean.TRUE.equals(request.getCreateAccount())
                || Boolean.TRUE.equals(request.getEnableProvisioning())
                || StringUtils.hasText(request.getUsername())
                || (isOwner && isFarmManager && request.getFarmId() != null);

        if (shouldProvision) {
            // 1. Kiểm tra giới hạn người dùng của Tenant Subscription
            TenantSubscription sub = tenantSubscriptionRepository.findByTenantIdAndIsActiveTrue(tenantId).orElse(null);
            if (sub != null && sub.getMaxUsers() != null) {
                long currentUsers = userRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");
                if (currentUsers >= sub.getMaxUsers()) {
                    throw new BusinessException("SUBSCRIPTION_USER_LIMIT_EXCEEDED",
                            String.format("Số lượng người dùng đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!",
                                    currentUsers, sub.getMaxUsers()));
                }
            }

            // 2. Xác định Username
            String username;
            if (StringUtils.hasText(request.getUsername())) {
                username = request.getUsername().trim();
            } else if (StringUtils.hasText(request.getPhone())) {
                username = request.getPhone().trim().replaceAll("[^0-9]", "");
            } else {
                username = (isFarmManager ? "fm_" : "emp_") + request.getEmployeeCode().toLowerCase().replace("-", "_");
            }

            if (userRepository.existsByUsername(username)) {
                if (!StringUtils.hasText(request.getUsername())) {
                    username = username + "_" + request.getEmployeeCode().toLowerCase().replace("-", "_");
                }
                if (userRepository.existsByUsername(username)) {
                    throw new BusinessException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại: " + username);
                }
            }

            // 3. Mật khẩu khởi tạo
            String rawPassword = StringUtils.hasText(request.getInitialPassword())
                    ? request.getInitialPassword()
                    : "Password@123";

            String email = StringUtils.hasText(request.getEmail())
                    ? request.getEmail().trim()
                    : (StringUtils.hasText(employee.getEmail()) ? employee.getEmail() : username + "@farm.local");

            // 4. Tạo User (#5)
            User user = User.builder()
                    .tenantId(tenantId)
                    .username(username)
                    .fullName(employee.getFullName())
                    .email(email)
                    .phone(employee.getPhone())
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .status("ACTIVE")
                    .isSuperAdmin(false)
                    .mustChangePassword(true)
                    .failedLogins(0)
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();

            user = userRepository.save(user);

            // 5. Liên kết User vào Employee
            employee.setUserId(user.getId());
            employee = employeeRepository.save(employee);

            // 6. Gán user_roles (#8)
            String targetRoleCode = request.getRoleCode();
            if (!StringUtils.hasText(targetRoleCode)) {
                String pos = request.getPosition() != null ? request.getPosition().trim().toUpperCase() : "";
                if (pos.contains("ZONE_MANAGER") || pos.contains("TECHNICAL_STAFF") || pos.contains("TECHNICAL_LEAD")) {
                    targetRoleCode = "ROLE_TECHNICAL_STAFF";
                } else if (pos.contains("WAREHOUSE_STAFF") || pos.contains("THỦ KHO") || pos.contains("THU KHO")) {
                    targetRoleCode = "ROLE_WAREHOUSE_STAFF";
                } else if (pos.contains("ACCOUNTANT") || pos.contains("KẾ TOÁN") || pos.contains("KE TOAN")) {
                    targetRoleCode = "ROLE_ACCOUNTANT";
                } else if (pos.contains("FIELD_STAFF")) {
                    targetRoleCode = "ROLE_FIELD_STAFF";
                } else if (isFarmManager) {
                    targetRoleCode = "ROLE_FARM_MANAGER";
                } else {
                    targetRoleCode = "ROLE_TECHNICAL_STAFF";
                }
            }

            final String finalRoleCode = targetRoleCode;
            if (farmSecurity != null) {
                farmSecurity.canAssignRole(finalRoleCode, employee.getFarmId());
            }

            Role role = roleRepository.findByCode(finalRoleCode)
                    .or(() -> roleRepository.findByCode("ROLE_" + finalRoleCode))
                    .or(() -> roleRepository.findByCode("ROLE_TECHNICAL_STAFF"))
                    .or(() -> roleRepository.findByCode("ROLE_FIELD_STAFF"))
                    .orElse(null);

            if (role != null) {
                UserRole ur = UserRole.builder()
                        .tenantId(tenantId)
                        .userId(user.getId())
                        .roleId(role.getId())
                        .farmId(employee.getFarmId())
                        .assignedAt(Instant.now())
                        .assignedBy(currentUserId)
                        .build();
                userRoleRepository.save(ur);
            }

            // 7. Gán user_farm_access (#12) cho farmId đó
            if (employee.getFarmId() != null) {
                if (!userFarmAccessRepository.existsByUserIdAndFarmId(user.getId(), employee.getFarmId())) {
                    UserFarmAccess access = UserFarmAccess.builder()
                            .userId(user.getId())
                            .farmId(employee.getFarmId())
                            .tenantId(tenantId)
                            .grantedAt(Instant.now())
                            .grantedBy(currentUserId)
                            .build();
                    userFarmAccessRepository.save(access);
                }
            }

            // 8. ĐẶC BIỆT: Khi Owner tạo nhân viên có position = "FARM_MANAGER" cho một farmId:
            // Cập nhật farms.manager_user_id = user.id (#11)
            // Tạo bản ghi farm_assignments (#15) với role_in_farm = 'FARM_MANAGER'
            if (isFarmManager && employee.getFarmId() != null) {
                Farm farm = farmRepository.findById(employee.getFarmId()).orElse(null);
                if (farm != null) {
                    farm.setManagerUserId(user.getId());
                    farm.setUpdatedAt(Instant.now());
                    farm.setUpdatedBy(currentUserId);
                    farmRepository.save(farm);
                }

                FarmAssignment assignment = FarmAssignment.builder()
                        .tenantId(tenantId)
                        .farmId(employee.getFarmId())
                        .userId(user.getId())
                        .roleInFarm("FARM_MANAGER")
                        .assignedFrom(request.getJoinedDate() != null ? request.getJoinedDate() : LocalDate.now())
                        .isActive(true)
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();
                farmAssignmentRepository.save(assignment);
            } else if (employee.getFarmId() != null) {
                String mappedRoleInFarm;
                if ("ROLE_TECHNICAL_STAFF".equalsIgnoreCase(finalRoleCode)) {
                    String pos = employee.getPosition() != null ? employee.getPosition().toUpperCase() : "";
                    if (pos.contains("ZONE_MANAGER")) mappedRoleInFarm = "ZONE_MANAGER";
                    else if (pos.contains("VET")) mappedRoleInFarm = "VETERINARIAN";
                    else if (pos.contains("AGRONOMIST")) mappedRoleInFarm = "AGRONOMIST";
                    else mappedRoleInFarm = "TECHNICAL_LEAD";
                } else if ("ROLE_WAREHOUSE_STAFF".equalsIgnoreCase(finalRoleCode)) {
                    mappedRoleInFarm = "WAREHOUSE_KEEPER";
                } else if ("ROLE_ACCOUNTANT".equalsIgnoreCase(finalRoleCode)) {
                    mappedRoleInFarm = "ACCOUNTANT";
                } else {
                    mappedRoleInFarm = "FIELD_WORKER";
                }

                FarmAssignment assignment = FarmAssignment.builder()
                        .tenantId(tenantId)
                        .farmId(employee.getFarmId())
                        .zoneId(request.getAssignedZoneId())
                        .userId(user.getId())
                        .roleInFarm(mappedRoleInFarm)
                        .assignedFrom(request.getJoinedDate() != null ? request.getJoinedDate() : LocalDate.now())
                        .isActive(true)
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();
                farmAssignmentRepository.save(assignment);
            }

            log.info("One-step provisioned user id={}, username={}, role={} for employee id={}",
                    user.getId(), user.getUsername(), targetRoleCode, employee.getId());
        }

        return mapToDetailResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeDetailResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        final Long currentTenantId = SecurityUtils.getCurrentTenantId();
        boolean tenantScope = isTenantScopeUser();

        Employee employee = employeeRepository.findById(id)
                .filter(e -> currentTenantId == null || e.getTenantId().equals(currentTenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        Long tenantId = currentTenantId != null ? currentTenantId : employee.getTenantId();

        // Rào chắn phân quyền trang trại
        if (!tenantScope) {
            Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();
            if (employee.getFarmId() == null || !accessibleFarmIds.contains(employee.getFarmId())) {
                throw new AccessDeniedException("Bạn không có quyền chỉnh sửa hồ sơ nhân sự này");
            }
            if (request.getFarmId() != null && !accessibleFarmIds.contains(request.getFarmId())) {
                throw new AccessDeniedException("Bạn không có quyền chuyển nhân sự sang trang trại ID: " + request.getFarmId());
            }
        }

        Long oldFarmId = employee.getFarmId();
        boolean farmChanged = request.getFarmId() != null && !Objects.equals(request.getFarmId(), oldFarmId);

        if (request.getFarmId() != null) {
            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));
            if (tenantId != null && !farm.getTenantId().equals(tenantId)) {
                throw new BusinessException("FARM_NOT_IN_TENANT", "Trang trại không thuộc tổ chức này");
            }
            employee.setFarmId(request.getFarmId());
        }

        LocalDate dob = request.getDateOfBirth() != null ? request.getDateOfBirth() : employee.getDateOfBirth();
        LocalDate joined = request.getJoinedDate() != null ? request.getJoinedDate() : employee.getJoinedDate();
        if (dob != null && joined != null && ChronoUnit.YEARS.between(dob, joined) < 18) {
            log.warn("UNDERAGE_EMPLOYEE violation on update: dob={} joined={}", dob, joined);
            throw new BusinessException("UNDERAGE_EMPLOYEE",
                    "Nhân viên chưa đủ 18 tuổi lao động tính đến ngày gia nhập (" + dob + " -> " + joined + ")",
                    Map.of("dateOfBirth", "Nhân viên chưa đủ 18 tuổi lao động tính đến ngày gia nhập"));
        }

        if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getJoinedDate() != null) {
            employee.setJoinedDate(request.getJoinedDate());
        }
        if (StringUtils.hasText(request.getFullName())) {
            employee.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            employee.setEmail(request.getEmail());
        }
        if (request.getIdCardNumber() != null) {
            employee.setIdCardNumber(request.getIdCardNumber());
        }
        if (request.getPosition() != null) {
            employee.setPosition(request.getPosition());
            // Tự động cập nhật phòng ban nếu người dùng không truyền phòng ban mới
            if (!StringUtils.hasText(request.getDepartment())) {
                employee.setDepartment(inferDepartmentFromPosition(request.getPosition()));
            }
        }
        if (StringUtils.hasText(request.getDepartment())) {
            employee.setDepartment(request.getDepartment().trim());
        }
        if (request.getBaseSalary() != null) {
            employee.setBaseSalary(request.getBaseSalary());
        }
        if (request.getHourlyRate() != null) {
            employee.setHourlyRate(request.getHourlyRate());
        }
        if (StringUtils.hasText(request.getContractType())) {
            employee.setContractType(request.getContractType());
        }

        boolean isResigningOrTerminated = false;
        if (StringUtils.hasText(request.getStatus())) {
            String oldStatus = employee.getStatus();
            String newStatus = request.getStatus();
            employee.setStatus(newStatus);
            if (("RESIGNED".equalsIgnoreCase(newStatus) || "TERMINATED".equalsIgnoreCase(newStatus))
                    && !"RESIGNED".equalsIgnoreCase(oldStatus) && !"TERMINATED".equalsIgnoreCase(oldStatus)) {
                isResigningOrTerminated = true;
            }
        }

        if (request.getAnnualLeaveQuota() != null) {
            employee.setAnnualLeaveQuota(request.getAnnualLeaveQuota());
        }

        // Chặn trùng Kế toán khi cập nhật
        String targetPos = request.getPosition() != null ? request.getPosition() : employee.getPosition();
        String targetStat = request.getStatus() != null ? request.getStatus() : employee.getStatus();
        Long targetFmId = employee.getFarmId();
        if ("ACCOUNTANT".equalsIgnoreCase(targetPos) && "ACTIVE".equalsIgnoreCase(targetStat) && targetFmId != null) {
            boolean activeAccountantExists = employeeRepository.findByTenantIdAndFarmIdOrderByCreatedAtDesc(tenantId, targetFmId)
                    .stream()
                    .anyMatch(e -> !e.getId().equals(employee.getId()) && "ACTIVE".equalsIgnoreCase(e.getStatus()) && "ACCOUNTANT".equalsIgnoreCase(e.getPosition()));
            if (activeAccountantExists) {
                throw new BusinessException("ACTIVE_ACCOUNTANT_ALREADY_EXISTS", "Trang trại này đã có Kế toán đang hoạt động (ACTIVE). Mỗi trang trại chỉ có tối đa 1 Kế toán!");
            }
        }

        final Long empUserId = employee.getUserId();
        final Long empFarmId = employee.getFarmId();

        // Xử lý chuyển phân khu (assignedZoneId)
        if (request.getAssignedZoneId() != null && request.getAssignedZoneId() > 0 && empFarmId != null) {
            ProductionZone targetZone = productionZoneRepository.findById(request.getAssignedZoneId())
                    .filter(z -> Objects.equals(z.getFarmId(), empFarmId))
                    .orElseThrow(() -> new BusinessException("ZONE_NOT_FOUND", "Phân khu được chỉ định không thuộc trang trại này"));
            if (!StringUtils.hasText(request.getDepartment())) {
                employee.setDepartment("Phân khu: " + targetZone.getName());
            }
            if (empUserId != null) {
                farmAssignmentRepository.findByUserIdAndIsActiveTrue(empUserId)
                        .stream()
                        .filter(fa -> Objects.equals(fa.getFarmId(), empFarmId))
                        .forEach(fa -> {
                            fa.setIsActive(false);
                            fa.setAssignedTo(LocalDate.now());
                            farmAssignmentRepository.save(fa);
                        });

                FarmAssignment newFa = FarmAssignment.builder()
                        .tenantId(tenantId)
                        .farmId(empFarmId)
                        .zoneId(request.getAssignedZoneId())
                        .userId(empUserId)
                        .roleInFarm(employee.getPosition() != null ? employee.getPosition() : "TECHNICAL_STAFF")
                        .assignedFrom(LocalDate.now())
                        .isActive(true)
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                farmAssignmentRepository.save(newFa);
            }
        }

        // Xử lý khi nhân sự THÔI VIỆC (RESIGNED / TERMINATED)
        if (isResigningOrTerminated && empUserId != null) {
            // 1. Khóa tài khoản user
            userRepository.findById(empUserId).ifPresent(u -> {
                u.setStatus("LOCKED");
                u.setUpdatedAt(Instant.now());
                userRepository.save(u);
            });

            // 2. Giải phóng vị trí quản lý tại trang trại nếu là FARM_MANAGER
            if (empFarmId != null) {
                farmRepository.findById(empFarmId).ifPresent(f -> {
                    if (Objects.equals(f.getManagerUserId(), empUserId)) {
                        f.setManagerUserId(null);
                        f.setUpdatedAt(Instant.now());
                        farmRepository.save(f);
                    }
                });

                // Vô hiệu hóa farm_assignments
                farmAssignmentRepository.findByUserIdAndIsActiveTrue(empUserId)
                        .stream()
                        .filter(fa -> Objects.equals(fa.getFarmId(), empFarmId))
                        .forEach(fa -> {
                            fa.setIsActive(false);
                            fa.setAssignedTo(LocalDate.now());
                            farmAssignmentRepository.save(fa);
                        });
            }
        }

        // Xử lý khi ĐỔI TRANG TRẠI cho FARM_MANAGER
        boolean isFm = "FARM_MANAGER".equalsIgnoreCase(employee.getPosition());
        if (farmChanged && isFm && empUserId != null && !isResigningOrTerminated) {
            // Giải phóng trại cũ
            if (oldFarmId != null) {
                farmRepository.findById(oldFarmId).ifPresent(oldF -> {
                    if (Objects.equals(oldF.getManagerUserId(), empUserId)) {
                        oldF.setManagerUserId(null);
                        oldF.setUpdatedAt(Instant.now());
                        farmRepository.save(oldF);
                    }
                });
                farmAssignmentRepository.findByUserIdAndIsActiveTrue(empUserId)
                        .stream()
                        .filter(fa -> Objects.equals(fa.getFarmId(), oldFarmId))
                        .forEach(fa -> {
                            fa.setIsActive(false);
                            fa.setAssignedTo(LocalDate.now());
                            farmAssignmentRepository.save(fa);
                        });
            }
            // Gán sang trại mới
            if (request.getFarmId() != null) {
                farmRepository.findById(request.getFarmId()).ifPresent(newF -> {
                    newF.setManagerUserId(empUserId);
                    newF.setUpdatedAt(Instant.now());
                    farmRepository.save(newF);
                });
                if (!userFarmAccessRepository.existsByUserIdAndFarmId(empUserId, request.getFarmId())) {
                    userFarmAccessRepository.save(UserFarmAccess.builder()
                            .userId(empUserId)
                            .farmId(request.getFarmId())
                            .tenantId(tenantId)
                            .grantedAt(Instant.now())
                            .grantedBy(SecurityUtils.getCurrentUserId())
                            .build());
                }
                farmAssignmentRepository.save(FarmAssignment.builder()
                        .tenantId(tenantId)
                        .farmId(request.getFarmId())
                        .userId(empUserId)
                        .roleInFarm("FARM_MANAGER")
                        .assignedFrom(LocalDate.now())
                        .isActive(true)
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build());
            }
        }

        employee.setUpdatedAt(Instant.now());
        employee.setUpdatedBy(SecurityUtils.getCurrentUserId());
        Employee savedEmployee = employeeRepository.save(employee);

        return mapToDetailResponse(savedEmployee);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeDetailResponse> getEmployees(Long farmId, String department, String status, String search, Pageable pageable) {
        final Long currentTenantId = SecurityUtils.getCurrentTenantId();
        boolean tenantScope = isTenantScopeUser();
        Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();

        // Biến xác định farmId lọc thực tế (null nếu truy vấn toàn bộ trang trại)
        Long effectiveFarmId = null;
        Set<Long> effectiveFarmIds = null;
        Long resolvedTenantId = currentTenantId;

        // 1. LOGIC PHÂN QUYỀN VÀ LỌC CỨNG (THE FARM BARRIER GUARD):
        if (!tenantScope) {
            // Cán bộ cấp Trang trại (FARM_MANAGER / role có scope_level = 'FARM'):
            // Bất kể client truyền farmId gì, Backend BẮT BUỘC chỉ trả về nhân viên thuộc accessibleFarmIds của người đó!
            if (accessibleFarmIds == null || accessibleFarmIds.isEmpty()) {
                log.warn("FARM scope user {} has no accessible farms. Returning empty page.", SecurityUtils.getCurrentUserId());
                return Page.empty(pageable);
            }

            if (farmId != null && accessibleFarmIds.contains(farmId)) {
                // Client truyền đúng một trong các trang trại mình được phân công phụ trách
                effectiveFarmId = farmId;
            } else {
                // Client không truyền farmId HOẶC cố tình truyền farmId của trang trại khác:
                // Cưỡng chế chỉ giới hạn trong accessibleFarmIds của cán bộ đó (VD: đang ở Bắc Ninh tuyệt đối không thấy Đà Lạt)
                if (accessibleFarmIds.size() == 1) {
                    effectiveFarmId = accessibleFarmIds.iterator().next();
                } else {
                    effectiveFarmIds = accessibleFarmIds;
                }
            }
        } else {
            // Chủ đầu tư / Quản trị viên Tenant (Owner / Super Admin / Accountant - scope_level = 'TENANT'):
            if (farmId != null) {
                // Khi có truyền ?farmId=X: Chỉ lọc đúng các nhân sự có employees.farm_id = X
                Farm farm = farmRepository.findById(farmId)
                        .filter(f -> currentTenantId == null || f.getTenantId().equals(currentTenantId))
                        .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));
                effectiveFarmId = farm.getId();
                if (resolvedTenantId == null) {
                    resolvedTenantId = farm.getTenantId();
                }
            }
            // Khi không truyền farmId: effectiveFarmId = null -> Trả về toàn bộ nhân sự tất cả các trang trại thuộc Tenant
        }

        final Long finalFarmId = effectiveFarmId;
        final Set<Long> finalFarmIds = effectiveFarmIds;
        final Long finalTenantId = resolvedTenantId;

        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (finalTenantId != null) {
                predicates.add(cb.equal(root.get("tenantId"), finalTenantId));
            }

            if (finalFarmId != null) {
                predicates.add(cb.equal(root.get("farmId"), finalFarmId));
            } else if (finalFarmIds != null && !finalFarmIds.isEmpty()) {
                predicates.add(root.get("farmId").in(finalFarmIds));
            }

            if (StringUtils.hasText(department)) {
                predicates.add(cb.equal(root.get("department"), department.trim()));
            }

            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status.trim().toUpperCase()));
            }

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codePred = cb.like(cb.lower(root.get("employeeCode")), pattern);
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate phonePred = cb.like(cb.lower(root.get("phone")), pattern);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(codePred, namePred, phonePred, emailPred));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Pre-fetch tên trang trại để điền farmName đầy đủ trong bảng tổng hợp
        Map<Long, String> farmNameMap = (resolvedTenantId != null ? farmRepository.findByTenantId(resolvedTenantId) : farmRepository.findAll()).stream()
                .collect(Collectors.toMap(Farm::getId, Farm::getName, (a, b) -> a));

        return employeeRepository.findAll(spec, pageable).map(emp -> mapToDetailResponse(emp, farmNameMap));
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeDetailResponse getEmployeeById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        boolean tenantScope = isTenantScopeUser();

        Employee employee = employeeRepository.findById(id)
                .filter(e -> tenantId == null || e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (!tenantScope) {
            Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();
            if (employee.getFarmId() == null || !accessibleFarmIds.contains(employee.getFarmId())) {
                throw new AccessDeniedException("Bạn không có quyền xem thông tin nhân sự này");
            }
        }

        return mapToDetailResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeDetailResponse provisionAccount(Long id, ProvisionAccountRequest request) {
        final Long currentTenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findById(id)
                .filter(e -> currentTenantId == null || e.getTenantId().equals(currentTenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        Long tenantId = currentTenantId != null ? currentTenantId : employee.getTenantId();

        if (employee.getUserId() != null) {
            throw new BusinessException("USER_ALREADY_EXISTS", "Nhân viên này đã được cấp tài khoản đăng nhập hệ thống (User ID: " + employee.getUserId() + ")");
        }

        // Check subscription user limit
        TenantSubscription sub = tenantSubscriptionRepository.findByTenantIdAndIsActiveTrue(tenantId).orElse(null);
        if (sub != null && sub.getMaxUsers() != null) {
            long currentUsers = userRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");
            if (currentUsers >= sub.getMaxUsers()) {
                throw new BusinessException("SUBSCRIPTION_USER_LIMIT_EXCEEDED",
                        String.format("Số lượng người dùng đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!",
                                currentUsers, sub.getMaxUsers()));
            }
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại: " + request.getUsername());
        }

        String rawPassword = StringUtils.hasText(request.getInitialPassword()) ? request.getInitialPassword() : "Farm@123456";
        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail() : (StringUtils.hasText(employee.getEmail()) ? employee.getEmail() : request.getUsername() + "@farm.local");

        User user = User.builder()
                .tenantId(tenantId)
                .username(request.getUsername())
                .fullName(employee.getFullName())
                .email(email)
                .phone(employee.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status("ACTIVE")
                .isSuperAdmin(false)
                .mustChangePassword(true)
                .failedLogins(0)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        User savedUser = userRepository.save(user);

        // Link user to employee
        employee.setUserId(savedUser.getId());
        employee.setUpdatedAt(Instant.now());
        employee.setUpdatedBy(currentUserId);
        Employee savedEmployee = employeeRepository.save(employee);

        final Long finalUserId = savedUser.getId();
        final Long finalFarmId = savedEmployee.getFarmId();
        final String empPosition = savedEmployee.getPosition();

        // Assign roles
        List<String> roleCodes = (request.getRoles() != null && !request.getRoles().isEmpty())
                ? request.getRoles()
                : List.of("ROLE_TECHNICAL_STAFF");

        for (String rCode : roleCodes) {
            farmSecurity.canAssignRole(rCode, finalFarmId);

            Role role = roleRepository.findByCode(rCode).orElse(null);
            if (role != null) {
                UserRole ur = UserRole.builder()
                        .tenantId(tenantId)
                        .userId(finalUserId)
                        .roleId(role.getId())
                        .farmId(finalFarmId)
                        .assignedAt(Instant.now())
                        .assignedBy(currentUserId)
                        .build();
                userRoleRepository.save(ur);
            }

            // Đồng bộ bổ nhiệm FARM_MANAGER hoặc nhân sự Cấp 4
            if ("ROLE_FARM_MANAGER".equalsIgnoreCase(rCode) && finalFarmId != null) {
                farmRepository.findById(finalFarmId).ifPresent(farm -> {
                    farm.setManagerUserId(finalUserId);
                    farm.setUpdatedAt(Instant.now());
                    farm.setUpdatedBy(currentUserId);
                    farmRepository.save(farm);
                });

                boolean hasAssignment = farmAssignmentRepository.findByUserIdAndIsActiveTrue(finalUserId)
                        .stream().anyMatch(a -> a.getFarmId().equals(finalFarmId) && "FARM_MANAGER".equalsIgnoreCase(a.getRoleInFarm()));
                if (!hasAssignment) {
                    farmAssignmentRepository.save(FarmAssignment.builder()
                            .tenantId(tenantId)
                            .farmId(finalFarmId)
                            .userId(finalUserId)
                            .roleInFarm("FARM_MANAGER")
                            .assignedFrom(LocalDate.now())
                            .isActive(true)
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build());
                }
            } else if (finalFarmId != null && ("ROLE_TECHNICAL_STAFF".equalsIgnoreCase(rCode)
                    || "ROLE_WAREHOUSE_STAFF".equalsIgnoreCase(rCode)
                    || "ROLE_ACCOUNTANT".equalsIgnoreCase(rCode)
                    || "ROLE_FIELD_STAFF".equalsIgnoreCase(rCode))) {
                String mappedRoleInFarm;
                if ("ROLE_TECHNICAL_STAFF".equalsIgnoreCase(rCode)) {
                    String pos = empPosition != null ? empPosition.toUpperCase() : "";
                    if (pos.contains("ZONE_MANAGER")) mappedRoleInFarm = "ZONE_MANAGER";
                    else if (pos.contains("VET")) mappedRoleInFarm = "VETERINARIAN";
                    else if (pos.contains("AGRONOMIST")) mappedRoleInFarm = "AGRONOMIST";
                    else mappedRoleInFarm = "TECHNICAL_LEAD";
                } else if ("ROLE_WAREHOUSE_STAFF".equalsIgnoreCase(rCode)) {
                    mappedRoleInFarm = "WAREHOUSE_KEEPER";
                } else if ("ROLE_ACCOUNTANT".equalsIgnoreCase(rCode)) {
                    mappedRoleInFarm = "ACCOUNTANT";
                } else {
                    mappedRoleInFarm = "FIELD_WORKER";
                }

                boolean hasAssignment = farmAssignmentRepository.findByUserIdAndIsActiveTrue(finalUserId)
                        .stream().anyMatch(a -> a.getFarmId().equals(finalFarmId) && mappedRoleInFarm.equalsIgnoreCase(a.getRoleInFarm()));
                if (!hasAssignment) {
                    farmAssignmentRepository.save(FarmAssignment.builder()
                            .tenantId(tenantId)
                            .farmId(finalFarmId)
                            .userId(finalUserId)
                            .roleInFarm(mappedRoleInFarm)
                            .assignedFrom(LocalDate.now())
                            .isActive(true)
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build());
                }
            }
        }

        // Assign farm access if employee has farm
        if (finalFarmId != null) {
            UserFarmAccess access = UserFarmAccess.builder()
                    .userId(finalUserId)
                    .farmId(finalFarmId)
                    .tenantId(tenantId)
                    .grantedAt(Instant.now())
                    .grantedBy(currentUserId)
                    .build();
            userFarmAccessRepository.save(access);
        }

        log.info("Provisioned user account id={}, username={} for employee id={}", finalUserId, savedUser.getUsername(), savedEmployee.getId());
        return mapToDetailResponse(savedEmployee);
    }

    private EmployeeDetailResponse mapToDetailResponse(Employee emp) {
        return mapToDetailResponse(emp, null);
    }

    private EmployeeDetailResponse mapToDetailResponse(Employee emp, Map<Long, String> farmNameMap) {
        String farmName = null;
        if (emp.getFarmId() != null) {
            farmName = farmNameMap != null ? farmNameMap.get(emp.getFarmId()) : null;
            if (farmName == null) {
                farmName = farmRepository.findById(emp.getFarmId()).map(Farm::getName).orElse(null);
            }
        }
        String username = null;
        String userStatus = null;
        if (emp.getUserId() != null) {
            User u = userRepository.findById(emp.getUserId()).orElse(null);
            if (u != null) {
                username = u.getUsername();
                userStatus = u.getStatus();
            }
        }

        Long assignedZoneId = null;
        String assignedZoneName = null;
        if (emp.getUserId() != null && emp.getFarmId() != null) {
            FarmAssignment fa = farmAssignmentRepository.findByUserIdAndIsActiveTrue(emp.getUserId())
                    .stream()
                    .filter(a -> Objects.equals(a.getFarmId(), emp.getFarmId()) && a.getZoneId() != null)
                    .findFirst()
                    .orElse(null);
            if (fa != null) {
                assignedZoneId = fa.getZoneId();
                assignedZoneName = productionZoneRepository.findById(fa.getZoneId()).map(ProductionZone::getName).orElse(null);
            }
        }
        if (assignedZoneId == null && emp.getFarmId() != null && StringUtils.hasText(emp.getDepartment())) {
            List<ProductionZone> zones = productionZoneRepository.findByFarmId(emp.getFarmId());
            for (ProductionZone z : zones) {
                if (emp.getDepartment().equalsIgnoreCase(z.getName()) || emp.getDepartment().contains(z.getName())) {
                    assignedZoneId = z.getId();
                    assignedZoneName = z.getName();
                    break;
                }
            }
        }

        return EmployeeDetailResponse.builder()
                .id(emp.getId())
                .tenantId(emp.getTenantId())
                .farmId(emp.getFarmId())
                .farmName(farmName)
                .assignedZoneId(assignedZoneId)
                .assignedZoneName(assignedZoneName)
                .userId(emp.getUserId())
                .username(username)
                .userStatus(userStatus)
                .employeeCode(emp.getEmployeeCode())
                .fullName(emp.getFullName())
                .phone(emp.getPhone())
                .email(emp.getEmail())
                .idCardNumber(emp.getIdCardNumber())
                .dateOfBirth(emp.getDateOfBirth())
                .position(emp.getPosition())
                .department(emp.getDepartment())
                .joinedDate(emp.getJoinedDate())
                .baseSalary(emp.getBaseSalary())
                .hourlyRate(emp.getHourlyRate())
                .contractType(emp.getContractType())
                .annualLeaveQuota(emp.getAnnualLeaveQuota())
                .status(emp.getStatus())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .build();
    }
}
