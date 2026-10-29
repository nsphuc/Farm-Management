package com.farm.saas.modules.hr.controller;

import com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest;
import com.farm.saas.modules.hr.dto.request.ProvisionAccountRequest;
import com.farm.saas.modules.hr.dto.request.UpdateEmployeeRequest;
import com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse;
import com.farm.saas.modules.hr.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<EmployeeDetailResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeDetailResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<EmployeeDetailResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_TASK_ASSIGN', 'PERM_HR_ATTENDANCE', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<Page<EmployeeDetailResponse>> getEmployees(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getEmployees(farmId, department, status, search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_TASK_ASSIGN', 'PERM_HR_ATTENDANCE', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<EmployeeDetailResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping("/{id}/provision-account")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<EmployeeDetailResponse> provisionAccount(
            @PathVariable Long id,
            @Valid @RequestBody ProvisionAccountRequest request) {
        return ResponseEntity.ok(employeeService.provisionAccount(id, request));
    }
}
