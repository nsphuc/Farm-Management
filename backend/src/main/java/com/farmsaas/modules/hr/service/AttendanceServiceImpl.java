package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.hr.dto.AttendanceResponse;
import com.farmsaas.modules.hr.dto.AttendanceSummaryDto;
import com.farmsaas.modules.hr.dto.CheckInRequest;
import com.farmsaas.modules.hr.dto.CheckOutRequest;
import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.ShiftAssignment;
import com.farmsaas.modules.hr.entity.TimeAttendance;
import com.farmsaas.modules.hr.entity.WorkShift;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
import com.farmsaas.modules.hr.repository.EmployeeRepository;
import com.farmsaas.modules.hr.repository.ShiftAssignmentRepository;
import com.farmsaas.modules.hr.repository.TimeAttendanceRepository;
import com.farmsaas.modules.hr.repository.WorkShiftRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private static final double ALLOWED_RADIUS_METERS = 500.0;
    private static final double EARTH_RADIUS_METERS = 6371000.0;

    private final TimeAttendanceRepository timeAttendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public AttendanceResponse checkIn(Long farmId, CheckInRequest request) {
        Long tenantId = getRequiredTenantId();
        Farm farm = validateAndGetFarm(tenantId, farmId);

        Employee employee = resolveEmployee(tenantId, farmId, request.getEmployeeId());
        LocalDate workDate = request.getWorkDate() != null ? request.getWorkDate() : LocalDate.now();

        // Kiểm tra xem đã check-in ngày này chưa
        Optional<TimeAttendance> existing = timeAttendanceRepository.findByTenantIdAndFarmIdAndEmployeeIdAndWorkDate(
                tenantId, farmId, employee.getId(), workDate);
        if (existing.isPresent() && existing.get().getCheckInTime() != null) {
            throw new BusinessException("Nhân viên " + employee.getFullName() + " đã check-in cho ngày " + workDate);
        }

        LocalDateTime now = LocalDateTime.now();

        // Xác định ca làm việc
        WorkShift shift = null;
        if (request.getShiftId() != null) {
            shift = workShiftRepository.findByIdAndTenantIdAndFarmId(request.getShiftId(), tenantId, farmId).orElse(null);
        } else {
            // Thử tìm ca được phân trong ngày
            Optional<ShiftAssignment> assignment = shiftAssignmentRepository.findByTenantIdAndFarmIdAndEmployeeIdAndAssignedDate(
                    tenantId, farmId, employee.getId(), workDate);
            if (assignment.isPresent() && assignment.get().getShift() != null) {
                shift = assignment.get().getShift();
            }
        }

        // Tính khoảng cách GPS Haversine
        BigDecimal distanceM = BigDecimal.ZERO;
        boolean outOfRadius = false;
        if (farm.getLatitude() != null && farm.getLongitude() != null && request.getLatitude() != null && request.getLongitude() != null) {
            double dist = calculateHaversineDistance(
                    request.getLatitude().doubleValue(),
                    request.getLongitude().doubleValue(),
                    farm.getLatitude().doubleValue(),
                    farm.getLongitude().doubleValue()
            );
            distanceM = BigDecimal.valueOf(dist).setScale(2, RoundingMode.HALF_UP);
            if (dist > ALLOWED_RADIUS_METERS) {
                outOfRadius = true;
            }
        }

        AttendanceStatus status;
        if (outOfRadius) {
            status = AttendanceStatus.NGOAI_BAN_KINH;
        } else if (shift != null) {
            LocalTime shiftStart = shift.getStartTime();
            int grace = shift.getLateGraceMinutes() != null ? shift.getLateGraceMinutes() : 15;
            LocalTime checkInTimeOnly = now.toLocalTime();
            if (checkInTimeOnly.isAfter(shiftStart.plusMinutes(grace))) {
                status = AttendanceStatus.DI_MUON;
            } else {
                status = AttendanceStatus.DUNG_GIO;
            }
        } else {
            status = AttendanceStatus.DUNG_GIO;
        }

        TimeAttendance attendance = existing.orElseGet(() -> TimeAttendance.builder()
                .farmId(farmId)
                .employeeId(employee.getId())
                .employee(employee)
                .workDate(workDate)
                .build());
        attendance.setTenantId(tenantId);
        attendance.setShiftId(shift != null ? shift.getId() : null);
        attendance.setShift(shift);
        attendance.setCheckInTime(now);
        attendance.setCheckInLatitude(request.getLatitude());
        attendance.setCheckInLongitude(request.getLongitude());
        attendance.setCheckInDistanceM(distanceM);
        attendance.setStatus(status);
        if (request.getNotes() != null) {
            attendance.setNotes(request.getNotes());
        }

        TimeAttendance saved = timeAttendanceRepository.save(attendance);
        log.info("Check-in successful for employee: {}, status: {}, distance: {}m", employee.getFullName(), status, distanceM);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AttendanceResponse checkOut(Long farmId, Long attendanceId, CheckOutRequest request) {
        Long tenantId = getRequiredTenantId();
        Farm farm = validateAndGetFarm(tenantId, farmId);

        TimeAttendance attendance;
        if (attendanceId != null) {
            attendance = timeAttendanceRepository.findByIdAndTenantIdAndFarmId(attendanceId, tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bản ghi chấm công ID: " + attendanceId));
        } else {
            Employee employee = resolveEmployee(tenantId, farmId, request.getEmployeeId());
            attendance = timeAttendanceRepository.findByTenantIdAndFarmIdAndEmployeeIdAndWorkDate(
                    tenantId, farmId, employee.getId(), LocalDate.now())
                    .orElseThrow(() -> new BusinessException("Chưa có lượt check-in hôm nay để check-out"));
        }

        if (attendance.getCheckInTime() == null) {
            throw new BusinessException("Không thể check-out khi chưa có thông tin check-in");
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckOutTime(now);
        attendance.setCheckOutLatitude(request.getLatitude());
        attendance.setCheckOutLongitude(request.getLongitude());

        // Tính khoảng cách GPS check-out
        if (farm.getLatitude() != null && farm.getLongitude() != null && request.getLatitude() != null && request.getLongitude() != null) {
            double dist = calculateHaversineDistance(
                    request.getLatitude().doubleValue(),
                    request.getLongitude().doubleValue(),
                    farm.getLatitude().doubleValue(),
                    farm.getLongitude().doubleValue()
            );
            attendance.setCheckOutDistanceM(BigDecimal.valueOf(dist).setScale(2, RoundingMode.HALF_UP));
        }

        // Tính giờ công làm việc
        Duration duration = Duration.between(attendance.getCheckInTime(), now);
        long minutes = Math.max(0, duration.toMinutes());

        WorkShift shift = attendance.getShift();
        int breakMinutes = 0;
        if (shift != null && shift.getBreakMinutes() != null && minutes > shift.getBreakMinutes()) {
            breakMinutes = shift.getBreakMinutes();
        }

        long actualWorkMinutes = Math.max(0, minutes - breakMinutes);
        BigDecimal workingHours = BigDecimal.valueOf(actualWorkMinutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        attendance.setWorkingHours(workingHours);

        // Tính overtime
        if (shift != null && shift.getWorkingHours() != null && workingHours.compareTo(shift.getWorkingHours()) > 0) {
            BigDecimal overtime = workingHours.subtract(shift.getWorkingHours());
            attendance.setOvertimeHours(overtime);
        } else {
            attendance.setOvertimeHours(BigDecimal.ZERO);
        }

        // Kiểm tra về sớm nếu trước đó đang là DUNG_GIO
        if (attendance.getStatus() == AttendanceStatus.DUNG_GIO && shift != null) {
            int earlyGrace = shift.getEarlyLeaveGraceMinutes() != null ? shift.getEarlyLeaveGraceMinutes() : 15;
            LocalTime checkOutTimeOnly = now.toLocalTime();
            if (checkOutTimeOnly.isBefore(shift.getEndTime().minusMinutes(earlyGrace))) {
                attendance.setStatus(AttendanceStatus.VE_SOM);
            }
        }

        if (request.getNotes() != null) {
            String currNotes = attendance.getNotes() != null ? attendance.getNotes() + "; " : "";
            attendance.setNotes(currNotes + request.getNotes());
        }

        TimeAttendance saved = timeAttendanceRepository.save(attendance);
        log.info("Check-out successful for attendance ID: {}, working hours: {}", saved.getId(), workingHours);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceResponse getTodayAttendance(Long farmId, Long employeeId) {
        Long tenantId = getRequiredTenantId();
        validateAndGetFarm(tenantId, farmId);

        Employee employee = resolveEmployee(tenantId, farmId, employeeId);
        return timeAttendanceRepository.findByTenantIdAndFarmIdAndEmployeeIdAndWorkDate(
                tenantId, farmId, employee.getId(), LocalDate.now())
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AttendanceResponse> searchAttendance(Long farmId, LocalDate startDate, LocalDate endDate, Long employeeId, AttendanceStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateAndGetFarm(tenantId, farmId);

        return timeAttendanceRepository.searchAttendance(tenantId, farmId, startDate, endDate, employeeId, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryDto getAttendanceSummary(Long farmId, Long employeeId, LocalDate startDate, LocalDate endDate) {
        Long tenantId = getRequiredTenantId();
        validateAndGetFarm(tenantId, farmId);

        Employee employee = resolveEmployee(tenantId, farmId, employeeId);
        if (startDate == null) startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null) endDate = startDate.plusMonths(1).minusDays(1);

        List<TimeAttendance> records = timeAttendanceRepository.findByTenantIdAndFarmIdAndEmployeeIdAndWorkDateBetween(
                tenantId, farmId, employee.getId(), startDate, endDate);

        long totalDays = records.size();
        BigDecimal totalWorkingHours = records.stream()
                .map(r -> r.getWorkingHours() != null ? r.getWorkingHours() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOvertimeHours = records.stream()
                .map(r -> r.getOvertimeHours() != null ? r.getOvertimeHours() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long onTimeCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.DUNG_GIO).count();
        long lateCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.DI_MUON).count();
        long earlyLeaveCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.VE_SOM).count();
        long outOfRadiusCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.NGOAI_BAN_KINH).count();

        return AttendanceSummaryDto.builder()
                .employeeId(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFullName())
                .totalWorkDays(totalDays)
                .totalWorkingHours(totalWorkingHours)
                .totalOvertimeHours(totalOvertimeHours)
                .onTimeCount(onTimeCount)
                .lateCount(lateCount)
                .earlyLeaveCount(earlyLeaveCount)
                .outOfRadiusCount(outOfRadiusCount)
                .build();
    }

    /**
     * Haversine formula to compute great-circle distance between two GPS coordinates in meters.
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
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

    private Farm validateAndGetFarm(Long tenantId, Long farmId) {
        return farmRepository.findByIdAndTenantId(farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId));
    }

    private AttendanceResponse mapToResponse(TimeAttendance ta) {
        return AttendanceResponse.builder()
                .id(ta.getId())
                .tenantId(ta.getTenantId())
                .farmId(ta.getFarmId())
                .employeeId(ta.getEmployeeId())
                .employeeCode(ta.getEmployee() != null ? ta.getEmployee().getEmployeeCode() : null)
                .employeeName(ta.getEmployee() != null ? ta.getEmployee().getFullName() : null)
                .shiftId(ta.getShiftId())
                .shiftName(ta.getShift() != null ? ta.getShift().getShiftName() : null)
                .workDate(ta.getWorkDate())
                .checkInTime(ta.getCheckInTime())
                .checkInLatitude(ta.getCheckInLatitude())
                .checkInLongitude(ta.getCheckInLongitude())
                .checkInDistanceM(ta.getCheckInDistanceM())
                .checkOutTime(ta.getCheckOutTime())
                .checkOutLatitude(ta.getCheckOutLatitude())
                .checkOutLongitude(ta.getCheckOutLongitude())
                .checkOutDistanceM(ta.getCheckOutDistanceM())
                .status(ta.getStatus())
                .workingHours(ta.getWorkingHours())
                .overtimeHours(ta.getOvertimeHours())
                .notes(ta.getNotes())
                .createdAt(ta.getCreatedAt())
                .build();
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
