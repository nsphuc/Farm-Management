package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.hr.dto.EmployeeRequest;
import com.farmsaas.modules.hr.dto.EmployeeResponse;
import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import com.farmsaas.modules.hr.repository.EmployeeRepository;
import com.farmsaas.modules.user.repository.UserRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public EmployeeResponse createEmployee(Long farmId, EmployeeRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        String employeeCode = request.getEmployeeCode().trim().toUpperCase();
        if (employeeRepository.existsByTenantIdAndFarmIdAndEmployeeCode(tenantId, farmId, employeeCode)) {
            throw new BusinessException("Mã nhân viên '" + employeeCode + "' đã tồn tại trong trang trại này.");
        }

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng ID: " + request.getUserId()));
        }

        Employee employee = Employee.builder()
                .farmId(farmId)
                .userId(request.getUserId())
                .employeeCode(employeeCode)
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .nationalId(request.getNationalId())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .department(request.getDepartment())
                .position(request.getPosition())
                .contractType(request.getContractType())
                .basicSalary(request.getBasicSalary() != null ? request.getBasicSalary() : BigDecimal.ZERO)
                .dailyAllowance(request.getDailyAllowance() != null ? request.getDailyAllowance() : BigDecimal.ZERO)
                .joinDate(request.getJoinDate())
                .terminationDate(request.getTerminationDate())
                .status(request.getStatus() != null ? request.getStatus() : EmployeeStatus.ACTIVE)
                .bankAccount(request.getBankAccount())
                .bankName(request.getBankName())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .build();
        employee.setTenantId(tenantId);

        Employee saved = employeeRepository.save(employee);
        log.info("Created employee code: {} with ID: {} for Farm ID: {}", saved.getEmployeeCode(), saved.getId(), farmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long farmId, Long id, EmployeeRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = employeeRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + id));

        String employeeCode = request.getEmployeeCode().trim().toUpperCase();
        if (!employee.getEmployeeCode().equalsIgnoreCase(employeeCode)
                && employeeRepository.existsByTenantIdAndFarmIdAndEmployeeCode(tenantId, farmId, employeeCode)) {
            throw new BusinessException("Mã nhân viên '" + employeeCode + "' đã tồn tại trong trang trại.");
        }

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng ID: " + request.getUserId()));
            employee.setUserId(request.getUserId());
        } else {
            employee.setUserId(null);
        }

        employee.setEmployeeCode(employeeCode);
        employee.setFullName(request.getFullName().trim());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setNationalId(request.getNationalId());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setAddress(request.getAddress());
        employee.setDepartment(request.getDepartment());
        employee.setPosition(request.getPosition());
        employee.setContractType(request.getContractType());
        if (request.getBasicSalary() != null) employee.setBasicSalary(request.getBasicSalary());
        if (request.getDailyAllowance() != null) employee.setDailyAllowance(request.getDailyAllowance());
        employee.setJoinDate(request.getJoinDate());
        employee.setTerminationDate(request.getTerminationDate());
        if (request.getStatus() != null) employee.setStatus(request.getStatus());
        employee.setBankAccount(request.getBankAccount());
        employee.setBankName(request.getBankName());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Employee updated = employeeRepository.save(employee);
        log.info("Updated employee ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = employeeRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + id));
        return mapToResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByUserId(Long farmId, Long userId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = employeeRepository.findByTenantIdAndFarmIdAndUserId(tenantId, farmId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hồ sơ nhân viên ứng với tài khoản người dùng ID: " + userId));
        return mapToResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> searchEmployees(Long farmId, String keyword, String department, EmployeeStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return employeeRepository.searchEmployees(tenantId, farmId, keyword, department, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees(Long farmId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return employeeRepository.findByTenantIdAndFarmId(tenantId, farmId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteEmployee(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = employeeRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + id));

        employeeRepository.delete(employee);
        log.info("Deleted employee ID: {} from Farm ID: {}", id, farmId);
    }

    private EmployeeResponse mapToResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .farmId(e.getFarmId())
                .userId(e.getUserId())
                .userEmail(e.getUser() != null ? e.getUser().getEmail() : null)
                .employeeCode(e.getEmployeeCode())
                .fullName(e.getFullName())
                .dateOfBirth(e.getDateOfBirth())
                .gender(e.getGender())
                .nationalId(e.getNationalId())
                .phone(e.getPhone())
                .email(e.getEmail())
                .address(e.getAddress())
                .department(e.getDepartment())
                .position(e.getPosition())
                .contractType(e.getContractType())
                .basicSalary(e.getBasicSalary())
                .dailyAllowance(e.getDailyAllowance())
                .joinDate(e.getJoinDate())
                .terminationDate(e.getTerminationDate())
                .status(e.getStatus())
                .bankAccount(e.getBankAccount())
                .bankName(e.getBankName())
                .emergencyContactName(e.getEmergencyContactName())
                .emergencyContactPhone(e.getEmergencyContactPhone())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
