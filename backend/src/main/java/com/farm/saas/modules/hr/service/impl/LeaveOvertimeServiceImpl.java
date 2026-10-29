package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.dto.request.ApproveLeaveRequest;
import com.farm.saas.modules.hr.dto.request.ApproveOvertimeRequest;
import com.farm.saas.modules.hr.dto.request.CreateLeaveRequest;
import com.farm.saas.modules.hr.dto.request.CreateOvertimeRequest;
import com.farm.saas.modules.hr.dto.response.LeaveRequestDetailResponse;
import com.farm.saas.modules.hr.dto.response.OvertimeRequestDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.LeaveRequest;
import com.farm.saas.modules.hr.entity.OvertimeRequest;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.LeaveRequestRepository;
import com.farm.saas.modules.hr.repository.OvertimeRequestRepository;
import com.farm.saas.modules.hr.service.LeaveOvertimeService;
import com.farm.saas.modules.masterdata.entity.WorkShift;
import com.farm.saas.modules.masterdata.repository.WorkShiftRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveOvertimeServiceImpl implements LeaveOvertimeService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final OvertimeRequestRepository overtimeRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final WorkShiftRepository workShiftRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public LeaveRequestDetailResponse createLeaveRequest(CreateLeaveRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Employee employee = resolveEmployee(tenantId, currentUserId, request.getEmployeeId());
        Farm farm = farmRepository.findById(request.getFarmId())
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("INVALID_LEAVE_DATES", "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu nghỉ");
        }

        LeaveRequest leave = LeaveRequest.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .employeeId(employee.getId())
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(request.getTotalDays())
                .reason(request.getReason())
                .status("PENDING")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        leave = leaveRequestRepository.save(leave);
        log.info("Created leave request id={}, employeeId={}, type={}, days={}", leave.getId(), employee.getId(), leave.getLeaveType(), leave.getTotalDays());

        // Bắn thông báo tự động cho Giám đốc trang trại
        if (notificationService != null && farm.getManagerUserId() != null) {
            try {
                notificationService.sendNotification(
                        tenantId,
                        farm.getManagerUserId(),
                        "Đơn xin nghỉ phép mới chờ phê duyệt",
                        String.format("Nhân viên [%s] vừa gửi đơn xin nghỉ phép (%s ngày) chờ phê duyệt.",
                                employee.getFullName(), leave.getTotalDays()),
                        "SYSTEM",
                        "LEAVE_REQUEST",
                        leave.getId(),
                        "/app/personnel"
                );
            } catch (Exception ex) {
                log.warn("Failed to send leave notification to farm manager: {}", ex.getMessage());
            }
        }

        return mapToLeaveResponse(leave, employee, farm);
    }

    @Override
    @Transactional
    public LeaveRequestDetailResponse approveLeaveRequest(Long id, ApproveLeaveRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        LeaveRequest leave = leaveRequestRepository.findById(id)
                .filter(l -> l.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));

        if (!"PENDING".equals(leave.getStatus())) {
            throw new BusinessException("LEAVE_NOT_PENDING", "Chỉ được xét duyệt đơn nghỉ phép đang ở trạng thái PENDING");
        }

        Long empId = leave.getEmployeeId();
        Employee employee = employeeRepository.findById(empId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", empId));

        if ("APPROVED".equals(request.getStatus())) {
            // Deduct annual leave quota if ANNUAL_LEAVE
            if ("ANNUAL_LEAVE".equals(leave.getLeaveType())) {
                BigDecimal currentQuota = employee.getAnnualLeaveQuota() != null ? employee.getAnnualLeaveQuota() : BigDecimal.ZERO;
                if (currentQuota.compareTo(leave.getTotalDays()) < 0) {
                    throw new BusinessException("INSUFFICIENT_LEAVE_QUOTA",
                            String.format("Quỹ phép năm của nhân viên không đủ (Còn: %.1f ngày, Yêu cầu: %.1f ngày)",
                                    currentQuota, leave.getTotalDays()));
                }
                employee.setAnnualLeaveQuota(currentQuota.subtract(leave.getTotalDays()));
            }

            java.time.LocalDate today = java.time.LocalDate.now();
            if (!today.isBefore(leave.getStartDate()) && !today.isAfter(leave.getEndDate())) {
                employee.setStatus("ON_LEAVE");
            }
            employee.setUpdatedAt(Instant.now());
            employee.setUpdatedBy(currentUserId);
            employeeRepository.save(employee);
            log.info("Processed leave approval for employee {}. Remaining quota: {}, status: {}",
                    employee.getId(), employee.getAnnualLeaveQuota(), employee.getStatus());

            leave.setStatus("APPROVED");
        } else {
            leave.setStatus("REJECTED");
            leave.setRejectionReason(request.getRejectionReason());
        }

        leave.setApprovedByUserId(currentUserId);
        leave.setApprovedAt(Instant.now());
        leave.setUpdatedAt(Instant.now());
        leave.setUpdatedBy(currentUserId);

        leave = leaveRequestRepository.save(leave);
        Farm farm = farmRepository.findById(leave.getFarmId()).orElse(null);

        // Bắn thông báo kết quả xét duyệt về cho tài khoản công nhân
        if (notificationService != null && employee.getUserId() != null) {
            try {
                String statusText = "APPROVED".equals(leave.getStatus()) ? "đã được phê duyệt" : "đã bị từ chối";
                notificationService.sendNotification(
                        tenantId,
                        employee.getUserId(),
                        "Kết quả xét duyệt đơn nghỉ phép",
                        String.format("Đơn xin nghỉ phép của bạn từ ngày %s đến ngày %s %s.",
                                leave.getStartDate(), leave.getEndDate(), statusText),
                        "SYSTEM",
                        "LEAVE_REQUEST",
                        leave.getId(),
                        "/app/daily-ops"
                );
            } catch (Exception ex) {
                log.warn("Failed to send leave approval notification to employee: {}", ex.getMessage());
            }
        }

        return mapToLeaveResponse(leave, employee, farm);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveRequestDetailResponse> getLeaveRequests(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (farmId != null) {
            return leaveRequestRepository.findByFarmId(farmId, pageable).map(this::enrichLeaveResponse);
        }
        return leaveRequestRepository.findByTenantId(tenantId, pageable).map(this::enrichLeaveResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveRequestDetailResponse getLeaveRequestById(Long id) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));
        return enrichLeaveResponse(leave);
    }

    @Override
    @Transactional
    public OvertimeRequestDetailResponse createOvertimeRequest(CreateOvertimeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Employee employee = resolveEmployee(tenantId, currentUserId, request.getEmployeeId());
        Farm farm = farmRepository.findById(request.getFarmId())
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        BigDecimal multiplier = request.getOtMultiplier() != null ? request.getOtMultiplier() : new BigDecimal("1.50");

        OvertimeRequest ot = OvertimeRequest.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .employeeId(employee.getId())
                .shiftId(request.getShiftId())
                .otDate(request.getOtDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .totalHours(request.getTotalHours())
                .otMultiplier(multiplier)
                .reason(request.getReason())
                .status("PENDING")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        ot = overtimeRequestRepository.save(ot);
        log.info("Created OT request id={}, employeeId={}, hours={}", ot.getId(), employee.getId(), ot.getTotalHours());

        // Bắn thông báo tự động cho Giám đốc trang trại
        if (notificationService != null && farm.getManagerUserId() != null) {
            try {
                notificationService.sendNotification(
                        tenantId,
                        farm.getManagerUserId(),
                        "Đơn đăng ký tăng ca mới chờ phê duyệt",
                        String.format("Nhân viên [%s] vừa gửi đơn đăng ký làm thêm giờ (%s giờ) chờ phê duyệt.",
                                employee.getFullName(), ot.getTotalHours()),
                        "SYSTEM",
                        "OVERTIME_REQUEST",
                        ot.getId(),
                        "/app/personnel"
                );
            } catch (Exception ex) {
                log.warn("Failed to send OT notification to farm manager: {}", ex.getMessage());
            }
        }

        WorkShift shift = request.getShiftId() != null ? workShiftRepository.findById(request.getShiftId()).orElse(null) : null;
        return mapToOvertimeResponse(ot, employee, farm, shift);
    }

    @Override
    @Transactional
    public OvertimeRequestDetailResponse approveOvertimeRequest(Long id, ApproveOvertimeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        OvertimeRequest ot = overtimeRequestRepository.findById(id)
                .filter(o -> o.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("OvertimeRequest", "id", id));

        if (!"PENDING".equals(ot.getStatus())) {
            throw new BusinessException("OT_NOT_PENDING", "Chỉ được xét duyệt đơn tăng ca đang ở trạng thái PENDING");
        }

        if ("APPROVED".equals(request.getStatus())) {
            ot.setStatus("APPROVED");
        } else {
            ot.setStatus("REJECTED");
            ot.setRejectionReason(request.getRejectionReason());
        }

        ot.setApprovedByUserId(currentUserId);
        ot.setApprovedAt(Instant.now());
        ot.setUpdatedAt(Instant.now());
        ot.setUpdatedBy(currentUserId);

        ot = overtimeRequestRepository.save(ot);

        // Bắn thông báo kết quả xét duyệt về cho tài khoản công nhân
        Employee otEmployee = employeeRepository.findById(ot.getEmployeeId()).orElse(null);
        if (notificationService != null && otEmployee != null && otEmployee.getUserId() != null) {
            try {
                String statusText = "APPROVED".equals(ot.getStatus()) ? "đã được phê duyệt" : "đã bị từ chối";
                notificationService.sendNotification(
                        tenantId,
                        otEmployee.getUserId(),
                        "Kết quả xét duyệt đơn tăng ca",
                        String.format("Đơn đăng ký tăng ca ngày %s (%s giờ) của bạn %s.",
                                ot.getOtDate(), ot.getTotalHours(), statusText),
                        "SYSTEM",
                        "OVERTIME_REQUEST",
                        ot.getId(),
                        "/app/daily-ops"
                );
            } catch (Exception ex) {
                log.warn("Failed to send OT approval notification to employee: {}", ex.getMessage());
            }
        }

        return enrichOvertimeResponse(ot);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OvertimeRequestDetailResponse> getOvertimeRequests(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (farmId != null) {
            return overtimeRequestRepository.findByFarmId(farmId, pageable).map(this::enrichOvertimeResponse);
        }
        return overtimeRequestRepository.findByTenantId(tenantId, pageable).map(this::enrichOvertimeResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OvertimeRequestDetailResponse getOvertimeRequestById(Long id) {
        OvertimeRequest ot = overtimeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OvertimeRequest", "id", id));
        return enrichOvertimeResponse(ot);
    }

    private Employee resolveEmployee(Long tenantId, Long currentUserId, Long requestedEmployeeId) {
        if (requestedEmployeeId != null) {
            return employeeRepository.findById(requestedEmployeeId)
                    .filter(e -> e.getTenantId().equals(tenantId))
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", requestedEmployeeId));
        }
        return employeeRepository.findByTenantIdAndUserId(tenantId, currentUserId)
                .orElseGet(() -> autoProvisionEmployeeProfile(tenantId, currentUserId, null));
    }

    private Employee autoProvisionEmployeeProfile(Long tenantId, Long userId, Long farmIdHint) {
        log.info("Tự phục hồi: Khởi tạo nhanh hồ sơ Employee cho tenantId={}, userId={}", tenantId, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("EMPLOYEE_PROFILE_REQUIRED", "Tài khoản hiện tại chưa được liên kết với hồ sơ nhân sự"));

        Long farmId = farmIdHint;
        if (farmId == null) {
            var farms = farmRepository.findByTenantId(tenantId);
            if (farms != null && !farms.isEmpty()) {
                farmId = farms.get(0).getId();
            }
        }

        String employeeCode = "EMP-SEED-" + userId;
        if (employeeRepository.findByTenantIdAndEmployeeCode(tenantId, employeeCode).isPresent()) {
            employeeCode = "EMP-SEED-" + userId + "-" + (System.currentTimeMillis() % 10000);
        }

        Employee employee = Employee.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .userId(userId)
                .employeeCode(employeeCode)
                .fullName(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername())
                .phone(user.getPhone())
                .email(user.getEmail())
                .joinedDate(LocalDate.now())
                .baseSalary(BigDecimal.ZERO)
                .hourlyRate(BigDecimal.ZERO)
                .contractType("FULL_TIME")
                .annualLeaveQuota(new BigDecimal("12.0"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(userId)
                .build();

        return employeeRepository.save(employee);
    }

    private LeaveRequestDetailResponse enrichLeaveResponse(LeaveRequest l) {
        Employee emp = employeeRepository.findById(l.getEmployeeId()).orElse(null);
        Farm farm = farmRepository.findById(l.getFarmId()).orElse(null);
        return mapToLeaveResponse(l, emp, farm);
    }

    private LeaveRequestDetailResponse mapToLeaveResponse(LeaveRequest l, Employee emp, Farm farm) {
        String approverName = null;
        if (l.getApprovedByUserId() != null) {
            approverName = userRepository.findById(l.getApprovedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        return LeaveRequestDetailResponse.builder()
                .id(l.getId())
                .farmId(l.getFarmId())
                .farmName(farm != null ? farm.getName() : null)
                .employeeId(l.getEmployeeId())
                .employeeName(emp != null ? emp.getFullName() : null)
                .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                .leaveType(l.getLeaveType())
                .startDate(l.getStartDate())
                .endDate(l.getEndDate())
                .totalDays(l.getTotalDays())
                .annualLeaveQuota(emp != null ? emp.getAnnualLeaveQuota() : null)
                .reason(l.getReason())
                .status(l.getStatus())
                .approvedByUserId(l.getApprovedByUserId())
                .approverName(approverName)
                .approvedAt(l.getApprovedAt())
                .rejectionReason(l.getRejectionReason())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    private OvertimeRequestDetailResponse enrichOvertimeResponse(OvertimeRequest o) {
        Employee emp = employeeRepository.findById(o.getEmployeeId()).orElse(null);
        Farm farm = farmRepository.findById(o.getFarmId()).orElse(null);
        WorkShift shift = o.getShiftId() != null ? workShiftRepository.findById(o.getShiftId()).orElse(null) : null;
        return mapToOvertimeResponse(o, emp, farm, shift);
    }

    private OvertimeRequestDetailResponse mapToOvertimeResponse(OvertimeRequest o, Employee emp, Farm farm, WorkShift shift) {
        String approverName = null;
        if (o.getApprovedByUserId() != null) {
            approverName = userRepository.findById(o.getApprovedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        return OvertimeRequestDetailResponse.builder()
                .id(o.getId())
                .farmId(o.getFarmId())
                .farmName(farm != null ? farm.getName() : null)
                .employeeId(o.getEmployeeId())
                .employeeName(emp != null ? emp.getFullName() : null)
                .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                .shiftId(o.getShiftId())
                .shiftName(shift != null ? shift.getName() : null)
                .otDate(o.getOtDate())
                .startTime(o.getStartTime())
                .endTime(o.getEndTime())
                .totalHours(o.getTotalHours())
                .otMultiplier(o.getOtMultiplier())
                .reason(o.getReason())
                .status(o.getStatus())
                .approvedByUserId(o.getApprovedByUserId())
                .approverName(approverName)
                .approvedAt(o.getApprovedAt())
                .rejectionReason(o.getRejectionReason())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
