package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest;
import com.farm.saas.modules.hr.dto.request.ProvisionAccountRequest;
import com.farm.saas.modules.hr.dto.request.UpdateEmployeeRequest;
import com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmployeeService {
    EmployeeDetailResponse createEmployee(CreateEmployeeRequest request);
    EmployeeDetailResponse updateEmployee(Long id, UpdateEmployeeRequest request);
    Page<EmployeeDetailResponse> getEmployees(Long farmId, String department, String status, String search, Pageable pageable);
    default Page<EmployeeDetailResponse> getEmployees(Long farmId, String department, String status, Pageable pageable) {
        return getEmployees(farmId, department, status, null, pageable);
    }
    EmployeeDetailResponse getEmployeeById(Long id);
    EmployeeDetailResponse provisionAccount(Long id, ProvisionAccountRequest request);
}
