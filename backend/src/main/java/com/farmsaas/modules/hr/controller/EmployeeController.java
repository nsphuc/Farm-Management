package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.hr.dto.EmployeeRequest;
import com.farmsaas.modules.hr.dto.EmployeeResponse;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import com.farmsaas.modules.hr.service.EmployeeService;
import com.farmsaas.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> searchEmployees(
            @PathVariable Long farmId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<EmployeeResponse> result = employeeService.searchEmployees(farmId, keyword, department, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm danh sách nhân viên thành công."));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees(@PathVariable Long farmId) {
        List<EmployeeResponse> list = employeeService.getAllEmployees(farmId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy toàn bộ nhân viên thành công."));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getCurrentEmployee(@PathVariable Long farmId) {
        Long userId = SecurityUtils.getCurrentUserId();
        EmployeeResponse employee = employeeService.getEmployeeByUserId(farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(employee, "Lấy hồ sơ nhân viên hiện tại thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        EmployeeResponse employee = employeeService.getEmployeeById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(employee, "Lấy chi tiết nhân viên thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @PathVariable Long farmId,
            @Valid @RequestBody EmployeeRequest request
    ) {
        EmployeeResponse response = employeeService.createEmployee(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thêm mới nhân viên thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request
    ) {
        EmployeeResponse response = employeeService.updateEmployee(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thông tin nhân viên thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        employeeService.deleteEmployee(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa hồ sơ nhân viên thành công."));
    }
}
