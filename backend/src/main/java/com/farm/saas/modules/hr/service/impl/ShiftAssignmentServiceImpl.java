package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.dto.request.AssignShiftRequest;
import com.farm.saas.modules.hr.dto.response.ShiftAssignmentResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.ShiftAssignment;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.ShiftAssignmentRepository;
import com.farm.saas.modules.hr.service.ShiftAssignmentService;
import com.farm.saas.modules.masterdata.entity.WorkShift;
import com.farm.saas.modules.masterdata.repository.WorkShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiftAssignmentServiceImpl implements ShiftAssignmentService {

    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final FarmRepository farmRepository;
    private final FarmSecurityEvaluator farmSecurity;

    @Override
    @Transactional
    public ShiftAssignmentResponse assignShift(AssignShiftRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        WorkShift shift = workShiftRepository.findById(request.getShiftId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkShift", "id", request.getShiftId()));

        Farm farm = farmRepository.findById(request.getFarmId())
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        if (shiftAssignmentRepository.findByEmployeeIdAndWorkDateAndShiftId(
                employee.getId(), request.getWorkDate(), shift.getId()).isPresent()) {
            throw new BusinessException("DUPLICATE_SHIFT_ASSIGNMENT", "Nhân viên đã được phân ca này trong ngày " + request.getWorkDate());
        }

        ShiftAssignment assignment = ShiftAssignment.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .employeeId(employee.getId())
                .shiftId(shift.getId())
                .workDate(request.getWorkDate())
                .status("SCHEDULED")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        assignment = shiftAssignmentRepository.save(assignment);
        log.info("Assigned shift id={} to employee id={} on date {}", shift.getId(), employee.getId(), request.getWorkDate());

        return mapToResponse(assignment, employee, shift, farm);
    }

    @Override
    @Transactional
    public ShiftAssignmentResponse updateAssignment(Long id, com.farm.saas.modules.hr.dto.request.UpdateShiftAssignmentRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        ShiftAssignment assignment = shiftAssignmentRepository.findById(id)
                .filter(a -> a.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", id));

        if (!farmSecurity.canAccessFarm(assignment.getFarmId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thao tác trên trang trại này.");
        }

        Long targetEmployeeId = request.getEmployeeId() != null ? request.getEmployeeId() : assignment.getEmployeeId();
        Long targetShiftId = request.getShiftId() != null ? request.getShiftId() : assignment.getShiftId();
        LocalDate targetWorkDate = request.getWorkDate() != null ? request.getWorkDate() : assignment.getWorkDate();

        Employee employee = employeeRepository.findById(targetEmployeeId)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", targetEmployeeId));

        WorkShift shift = workShiftRepository.findById(targetShiftId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkShift", "id", targetShiftId));

        final Long currentAssignmentId = assignment.getId();
        // Check duplicate constraint (uk_employee_shift_date) excluding this assignment id
        shiftAssignmentRepository.findByEmployeeIdAndWorkDateAndShiftId(targetEmployeeId, targetWorkDate, targetShiftId)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(currentAssignmentId)) {
                        throw new BusinessException("DUPLICATE_SHIFT_ASSIGNMENT", "Nhân viên này đã được phân công ca làm việc trùng trong ngày đã chọn!");
                    }
                });

        assignment.setEmployeeId(targetEmployeeId);
        assignment.setShiftId(targetShiftId);
        assignment.setWorkDate(targetWorkDate);
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            assignment.setStatus(request.getStatus().toUpperCase());
        }
        assignment.setUpdatedAt(Instant.now());
        assignment.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ShiftAssignment savedAssignment = shiftAssignmentRepository.save(assignment);
        log.info("Updated shift assignment id={} to emp={}, shift={}, date={}, status={}",
                id, targetEmployeeId, targetShiftId, targetWorkDate, savedAssignment.getStatus());

        return enrichResponse(savedAssignment);
    }

    @Override
    @Transactional
    public ShiftAssignmentResponse cancelAssignment(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        ShiftAssignment assignment = shiftAssignmentRepository.findById(id)
                .filter(a -> a.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", id));

        if (!"SCHEDULED".equalsIgnoreCase(assignment.getStatus())) {
            throw new BusinessException("CANNOT_CANCEL_SHIFT", "Chỉ có thể hủy ca làm việc ở trạng thái SCHEDULED (Chưa diễn ra). Ca này đang ở trạng thái: " + assignment.getStatus());
        }

        assignment.setStatus("CANCELLED");
        assignment.setUpdatedAt(Instant.now());
        assignment.setUpdatedBy(SecurityUtils.getCurrentUserId());
        assignment = shiftAssignmentRepository.save(assignment);
        log.info("Cancelled shift assignment id={} by user {}", id, SecurityUtils.getCurrentUserId());

        return enrichResponse(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getAssignmentsByFarmAndDate(Long farmId, LocalDate workDate) {
        return shiftAssignmentRepository.findByFarmIdAndWorkDate(farmId, workDate).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getAssignmentsByEmployeeAndDate(Long employeeId, LocalDate workDate) {
        return shiftAssignmentRepository.findByEmployeeIdAndWorkDate(employeeId, workDate).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
    }

    private ShiftAssignmentResponse enrichResponse(ShiftAssignment a) {
        Employee emp = employeeRepository.findById(a.getEmployeeId()).orElse(null);
        WorkShift ws = workShiftRepository.findById(a.getShiftId()).orElse(null);
        Farm farm = farmRepository.findById(a.getFarmId()).orElse(null);
        return mapToResponse(a, emp, ws, farm);
    }

    private ShiftAssignmentResponse mapToResponse(ShiftAssignment a, Employee emp, WorkShift ws, Farm farm) {
        return ShiftAssignmentResponse.builder()
                .id(a.getId())
                .farmId(a.getFarmId())
                .farmName(farm != null ? farm.getName() : null)
                .employeeId(a.getEmployeeId())
                .employeeName(emp != null ? emp.getFullName() : null)
                .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                .shiftId(a.getShiftId())
                .shiftName(ws != null ? ws.getName() : null)
                .shiftCode(ws != null ? ws.getShiftCode() : null)
                .startTime(ws != null ? ws.getStartTime() : null)
                .endTime(ws != null ? ws.getEndTime() : null)
                .workDate(a.getWorkDate())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
