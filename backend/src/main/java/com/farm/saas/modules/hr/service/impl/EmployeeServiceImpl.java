package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.repository.FarmRepository;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public EmployeeDetailResponse createEmployee(CreateEmployeeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Age check >= 18
        LocalDate dob = request.getDateOfBirth();
        LocalDate checkDate = request.getJoinedDate() != null ? request.getJoinedDate() : LocalDate.now();
        if (dob != null && ChronoUnit.YEARS.between(dob, checkDate) < 18) {
            log.warn("UNDERAGE_EMPLOYEE violation: dob={} checkDate={}", dob, checkDate);
            throw new BusinessException("UNDERAGE_EMPLOYEE", "Nhân viên chưa đủ 18 tuổi lao động tính đến ngày gia nhập (" + dob + " -> " + checkDate + ")");
        }

        if (employeeRepository.findByTenantIdAndEmployeeCode(tenantId, request.getEmployeeCode()).isPresent()) {
            throw new BusinessException("DUPLICATE_EMPLOYEE_CODE", "Mã nhân viên đã tồn tại: " + request.getEmployeeCode());
        }

        if (request.getFarmId() != null) {
            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));
            if (!farm.getTenantId().equals(tenantId)) {
                throw new BusinessException("FARM_NOT_IN_TENANT", "Trang trại không thuộc tổ chức này");
            }
        }

        BigDecimal baseSalary = request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal hourlyRate = request.getHourlyRate() != null ? request.getHourlyRate() : BigDecimal.ZERO;
        BigDecimal leaveQuota = request.getAnnualLeaveQuota() != null ? request.getAnnualLeaveQuota() : new BigDecimal("12.0");

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
                .department(request.getDepartment())
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
        log.info("Created employee id={}, code={} on tenantId={}", employee.getId(), employee.getEmployeeCode(), tenantId);

        return mapToDetailResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeDetailResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (request.getFarmId() != null) {
            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));
            if (!farm.getTenantId().equals(tenantId)) {
                throw new BusinessException("FARM_NOT_IN_TENANT", "Trang trại không thuộc tổ chức này");
            }
            employee.setFarmId(request.getFarmId());
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
        }
        if (request.getDepartment() != null) {
            employee.setDepartment(request.getDepartment());
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
        if (StringUtils.hasText(request.getStatus())) {
            employee.setStatus(request.getStatus());
        }
        if (request.getAnnualLeaveQuota() != null) {
            employee.setAnnualLeaveQuota(request.getAnnualLeaveQuota());
        }

        employee.setUpdatedAt(Instant.now());
        employee.setUpdatedBy(SecurityUtils.getCurrentUserId());
        employee = employeeRepository.save(employee);

        return mapToDetailResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeDetailResponse> getEmployees(Long farmId, String department, String status, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (farmId != null) {
            return employeeRepository.findByTenantIdAndFarmId(tenantId, farmId, pageable).map(this::mapToDetailResponse);
        }
        return employeeRepository.findByTenantId(tenantId, pageable).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeDetailResponse getEmployeeById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return mapToDetailResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeDetailResponse provisionAccount(Long id, ProvisionAccountRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

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

        user = userRepository.save(user);

        // Link user to employee
        employee.setUserId(user.getId());
        employee.setUpdatedAt(Instant.now());
        employee.setUpdatedBy(currentUserId);
        employee = employeeRepository.save(employee);

        // Assign roles
        List<String> roleCodes = (request.getRoles() != null && !request.getRoles().isEmpty())
                ? request.getRoles()
                : List.of("ROLE_TECHNICAL_STAFF");

        for (String rCode : roleCodes) {
            Role role = roleRepository.findByCode(rCode).orElse(null);
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
        }

        // Assign farm access if employee has farm
        if (employee.getFarmId() != null) {
            UserFarmAccess access = UserFarmAccess.builder()
                    .userId(user.getId())
                    .farmId(employee.getFarmId())
                    .tenantId(tenantId)
                    .grantedAt(Instant.now())
                    .grantedBy(currentUserId)
                    .build();
            userFarmAccessRepository.save(access);
        }

        log.info("Provisioned user account id={}, username={} for employee id={}", user.getId(), user.getUsername(), employee.getId());
        return mapToDetailResponse(employee);
    }

    private EmployeeDetailResponse mapToDetailResponse(Employee emp) {
        String farmName = null;
        if (emp.getFarmId() != null) {
            farmName = farmRepository.findById(emp.getFarmId()).map(Farm::getName).orElse(null);
        }
        String username = null;
        if (emp.getUserId() != null) {
            username = userRepository.findById(emp.getUserId()).map(User::getUsername).orElse(null);
        }

        return EmployeeDetailResponse.builder()
                .id(emp.getId())
                .tenantId(emp.getTenantId())
                .farmId(emp.getFarmId())
                .farmName(farmName)
                .userId(emp.getUserId())
                .username(username)
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
