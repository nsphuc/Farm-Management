package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.EmployeeRequest;
import com.farmsaas.modules.hr.dto.EmployeeResponse;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EmployeeService {

    EmployeeResponse createEmployee(Long farmId, EmployeeRequest request);

    EmployeeResponse updateEmployee(Long farmId, Long id, EmployeeRequest request);

    EmployeeResponse getEmployeeById(Long farmId, Long id);

    EmployeeResponse getEmployeeByUserId(Long farmId, Long userId);

    Page<EmployeeResponse> searchEmployees(Long farmId, String keyword, String department, EmployeeStatus status, Pageable pageable);

    List<EmployeeResponse> getAllEmployees(Long farmId);

    void deleteEmployee(Long farmId, Long id);
}
