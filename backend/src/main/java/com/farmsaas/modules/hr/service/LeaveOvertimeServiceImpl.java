package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.hr.dto.*;
import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.LeaveRequest;
import com.farmsaas.modules.hr.entity.OvertimeRequest;
import com.farmsaas.modules.hr.entity.enums.RequestStatus;
import com.farmsaas.modules.hr.repository.EmployeeRepository;
import com.farmsaas.modules.hr.repository.LeaveRequestRepository;
import com.farmsaas.modules.hr.repository.OvertimeRequestRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveOvertimeServiceImpl implements LeaveOvertimeService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final OvertimeRequestRepository overtimeRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public LeaveResponse createLeaveRequest(Long farmId, LeaveRequestDto request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = resolveEmployee(tenantId, farmId, request.getEmployeeId());

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("Ngày kết thúc nghỉ không thể trước ngày bắt đầu");
        }

        LeaveRequest leave = LeaveRequest.builder()
                .farmId(farmId)
                .employeeId(employee.getId())
                .employee(employee)
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(request.getTotalDays())
                .reason(request.getReason())
                .status(RequestStatus.PENDING)
                .build();
        leave.setTenantId(tenantId);

        LeaveRequest saved = leaveRequestRepository.save(leave);
        log.info("Created leave request ID: {} for employee: {}", saved.getId(), employee.getFullName());
        return mapLeaveToResponse(saved);
    }

    @Override
    @Transactional
    public LeaveResponse approveOrRejectLeave(Long farmId, Long leaveId, ApproveRejectRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LeaveRequest leave = leaveRequestRepository.findByIdAndTenantIdAndFarmId(leaveId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn nghỉ phép ID: " + leaveId));

        if (leave.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Đơn nghỉ phép này đã được xử lý trước đó");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        leave.setStatus(request.getApproved() ? RequestStatus.APPROVED : RequestStatus.REJECTED);
        leave.setApprovedBy(currentUserId);
        leave.setApprovedAt(LocalDateTime.now());
        if (!request.getApproved()) {
            leave.setRejectionReason(request.getRejectionReason());
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);
        log.info("Leave request ID: {} status changed to: {}", leaveId, saved.getStatus());
        return mapLeaveToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveResponse> searchLeaves(Long farmId, Long employeeId, RequestStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return leaveRequestRepository.searchLeaves(tenantId, farmId, employeeId, status, fromDate, toDate, pageable)
                .map(this::mapLeaveToResponse);
    }

    @Override
    @Transactional
    public OvertimeResponse createOvertimeRequest(Long farmId, OvertimeRequestDto request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Employee employee = resolveEmployee(tenantId, farmId, request.getEmployeeId());

        OvertimeRequest ot = OvertimeRequest.builder()
                .farmId(farmId)
                .employeeId(employee.getId())
                .employee(employee)
                .overtimeDate(request.getOvertimeDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .plannedHours(request.getPlannedHours())
                .reason(request.getReason())
                .status(RequestStatus.PENDING)
                .build();
        ot.setTenantId(tenantId);

        OvertimeRequest saved = overtimeRequestRepository.save(ot);
        log.info("Created overtime request ID: {} for employee: {}", saved.getId(), employee.getFullName());
        return mapOvertimeToResponse(saved);
    }

    @Override
    @Transactional
    public OvertimeResponse approveOrRejectOvertime(Long farmId, Long overtimeId, ApproveRejectRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        OvertimeRequest ot = overtimeRequestRepository.findByIdAndTenantIdAndFarmId(overtimeId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn tăng ca ID: " + overtimeId));

        if (ot.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Đơn tăng ca này đã được xử lý trước đó");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        ot.setStatus(request.getApproved() ? RequestStatus.APPROVED : RequestStatus.REJECTED);
        ot.setApprovedBy(currentUserId);
        ot.setApprovedAt(LocalDateTime.now());
        if (!request.getApproved()) {
            ot.setRejectionReason(request.getRejectionReason());
        }

        OvertimeRequest saved = overtimeRequestRepository.save(ot);
        log.info("Overtime request ID: {} status changed to: {}", overtimeId, saved.getStatus());
        return mapOvertimeToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OvertimeResponse> searchOvertime(Long farmId, Long employeeId, RequestStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return overtimeRequestRepository.searchOvertime(tenantId, farmId, employeeId, status, fromDate, toDate, pageable)
                .map(this::mapOvertimeToResponse);
    }

    private Employee resolveEmployee(Long tenantId, Long farmId, Long employeeId) {
        if (employeeId != null) {
            return employeeRepository.findByIdAndTenantIdAndFarmId(employeeId, tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + employeeId));
        }
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            return employeeRepository.findByTenantIdAndFarmIdAndUserId(tenantId, farmId, currentUserId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hồ sơ nhân viên cho người dùng hiện tại"));
        }
        throw new BusinessException("Vui lòng cung cấp mã ID nhân viên");
    }

    private LeaveResponse mapLeaveToResponse(LeaveRequest l) {
        return LeaveResponse.builder()
                .id(l.getId())
                .tenantId(l.getTenantId())
                .farmId(l.getFarmId())
                .employeeId(l.getEmployeeId())
                .employeeCode(l.getEmployee() != null ? l.getEmployee().getEmployeeCode() : null)
                .employeeName(l.getEmployee() != null ? l.getEmployee().getFullName() : null)
                .leaveType(l.getLeaveType())
                .startDate(l.getStartDate())
                .endDate(l.getEndDate())
                .totalDays(l.getTotalDays())
                .reason(l.getReason())
                .status(l.getStatus())
                .approvedBy(l.getApprovedBy())
                .approverName(l.getApprover() != null ? l.getApprover().getFullName() : null)
                .approvedAt(l.getApprovedAt())
                .rejectionReason(l.getRejectionReason())
                .createdAt(l.getCreatedAt())
                .build();
    }

    private OvertimeResponse mapOvertimeToResponse(OvertimeRequest o) {
        return OvertimeResponse.builder()
                .id(o.getId())
                .tenantId(o.getTenantId())
                .farmId(o.getFarmId())
                .employeeId(o.getEmployeeId())
                .employeeCode(o.getEmployee() != null ? o.getEmployee().getEmployeeCode() : null)
                .employeeName(o.getEmployee() != null ? o.getEmployee().getFullName() : null)
                .overtimeDate(o.getOvertimeDate())
                .startTime(o.getStartTime())
                .endTime(o.getEndTime())
                .plannedHours(o.getPlannedHours())
                .actualHours(o.getActualHours())
                .reason(o.getReason())
                .status(o.getStatus())
                .approvedBy(o.getApprovedBy())
                .approverName(o.getApprover() != null ? o.getApprover().getFullName() : null)
                .approvedAt(o.getApprovedAt())
                .rejectionReason(o.getRejectionReason())
                .createdAt(o.getCreatedAt())
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
