package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.hr.dto.ShiftAssignmentRequest;
import com.farmsaas.modules.hr.dto.ShiftAssignmentResponse;
import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.ShiftAssignment;
import com.farmsaas.modules.hr.entity.WorkShift;
import com.farmsaas.modules.hr.entity.enums.AssignmentStatus;
import com.farmsaas.modules.hr.repository.EmployeeRepository;
import com.farmsaas.modules.hr.repository.ShiftAssignmentRepository;
import com.farmsaas.modules.hr.repository.WorkShiftRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiftAssignmentServiceImpl implements ShiftAssignmentService {

    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getRosterSchedule(Long farmId, LocalDate startDate, LocalDate endDate, Long employeeId, Long shiftId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        if (startDate == null) startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null) endDate = startDate.plusMonths(1).minusDays(1);

        List<ShiftAssignment> list = shiftAssignmentRepository.findRosterSchedule(tenantId, farmId, startDate, endDate, employeeId, shiftId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ShiftAssignmentResponse assignShift(Long farmId, ShiftAssignmentRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = employeeRepository.findByIdAndTenantIdAndFarmId(request.getEmployeeId(), tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + request.getEmployeeId()));

        WorkShift shift = workShiftRepository.findByIdAndTenantIdAndFarmId(request.getShiftId(), tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ca làm việc ID: " + request.getShiftId()));

        Optional<ShiftAssignment> existing = shiftAssignmentRepository.findByTenantIdAndFarmIdAndEmployeeIdAndAssignedDate(
                tenantId, farmId, request.getEmployeeId(), request.getAssignedDate());

        ShiftAssignment assignment;
        if (existing.isPresent()) {
            assignment = existing.get();
            assignment.setShiftId(shift.getId());
            assignment.setShift(shift);
            assignment.setNote(request.getNote());
            if (request.getStatus() != null) assignment.setStatus(request.getStatus());
        } else {
            assignment = ShiftAssignment.builder()
                    .farmId(farmId)
                    .employeeId(employee.getId())
                    .employee(employee)
                    .shiftId(shift.getId())
                    .shift(shift)
                    .assignedDate(request.getAssignedDate())
                    .status(request.getStatus() != null ? request.getStatus() : AssignmentStatus.ASSIGNED)
                    .note(request.getNote())
                    .build();
            assignment.setTenantId(tenantId);
        }

        ShiftAssignment saved = shiftAssignmentRepository.save(assignment);
        log.info("Assigned shift: {} to employee: {} on {}", shift.getShiftCode(), employee.getFullName(), request.getAssignedDate());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<ShiftAssignmentResponse> batchAssignShifts(Long farmId, ShiftAssignmentRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        WorkShift shift = workShiftRepository.findByIdAndTenantIdAndFarmId(request.getShiftId(), tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ca làm việc ID: " + request.getShiftId()));

        List<Long> employeeIds = request.getBatchEmployeeIds() != null && !request.getBatchEmployeeIds().isEmpty()
                ? request.getBatchEmployeeIds()
                : List.of(request.getEmployeeId());

        List<LocalDate> dates = request.getBatchDates() != null && !request.getBatchDates().isEmpty()
                ? request.getBatchDates()
                : List.of(request.getAssignedDate());

        List<ShiftAssignmentResponse> results = new ArrayList<>();

        for (Long empId : employeeIds) {
            Employee emp = employeeRepository.findByIdAndTenantIdAndFarmId(empId, tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + empId));

            for (LocalDate date : dates) {
                Optional<ShiftAssignment> existing = shiftAssignmentRepository.findByTenantIdAndFarmIdAndEmployeeIdAndAssignedDate(
                        tenantId, farmId, empId, date);

                ShiftAssignment assignment;
                if (existing.isPresent()) {
                    assignment = existing.get();
                    assignment.setShiftId(shift.getId());
                    assignment.setShift(shift);
                    assignment.setNote(request.getNote());
                } else {
                    assignment = ShiftAssignment.builder()
                            .farmId(farmId)
                            .employeeId(emp.getId())
                            .employee(emp)
                            .shiftId(shift.getId())
                            .shift(shift)
                            .assignedDate(date)
                            .status(AssignmentStatus.ASSIGNED)
                            .note(request.getNote())
                            .build();
                    assignment.setTenantId(tenantId);
                }
                ShiftAssignment saved = shiftAssignmentRepository.save(assignment);
                results.add(mapToResponse(saved));
            }
        }

        log.info("Batch assigned {} shift slots for Farm ID: {}", results.size(), farmId);
        return results;
    }

    @Override
    @Transactional
    public void cancelOrDeleteAssignment(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ShiftAssignment assignment = shiftAssignmentRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lịch phân ca ID: " + id));

        shiftAssignmentRepository.delete(assignment);
        log.info("Deleted shift assignment ID: {}", id);
    }

    private ShiftAssignmentResponse mapToResponse(ShiftAssignment sa) {
        return ShiftAssignmentResponse.builder()
                .id(sa.getId())
                .tenantId(sa.getTenantId())
                .farmId(sa.getFarmId())
                .employeeId(sa.getEmployeeId())
                .employeeCode(sa.getEmployee() != null ? sa.getEmployee().getEmployeeCode() : null)
                .employeeName(sa.getEmployee() != null ? sa.getEmployee().getFullName() : null)
                .shiftId(sa.getShiftId())
                .shiftCode(sa.getShift() != null ? sa.getShift().getShiftCode() : null)
                .shiftName(sa.getShift() != null ? sa.getShift().getShiftName() : null)
                .startTime(sa.getShift() != null && sa.getShift().getStartTime() != null ? sa.getShift().getStartTime().toString() : null)
                .endTime(sa.getShift() != null && sa.getShift().getEndTime() != null ? sa.getShift().getEndTime().toString() : null)
                .assignedDate(sa.getAssignedDate())
                .status(sa.getStatus())
                .note(sa.getNote())
                .createdAt(sa.getCreatedAt())
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
