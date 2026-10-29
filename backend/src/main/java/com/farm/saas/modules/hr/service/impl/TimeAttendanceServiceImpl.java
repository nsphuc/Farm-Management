package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.common.util.GeoDistanceUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.modules.hr.dto.request.AdjustAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.BatchRollCallRequest;
import com.farm.saas.modules.hr.dto.request.CheckInAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.CheckOutAttendanceRequest;
import com.farm.saas.modules.hr.dto.response.BatchRollCallResponse;
import com.farm.saas.modules.hr.dto.response.CheckInAttendanceResponse;
import com.farm.saas.modules.hr.dto.response.TimeAttendanceDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.TimeAttendance;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.TimeAttendanceRepository;
import com.farm.saas.modules.hr.service.TimeAttendanceService;
import com.farm.saas.modules.masterdata.entity.WorkShift;
import com.farm.saas.modules.masterdata.repository.WorkShiftRepository;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.modules.geography.entity.FarmAssignment;
import com.farm.saas.modules.geography.repository.FarmAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TimeAttendanceServiceImpl implements TimeAttendanceService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TimeAttendanceRepository timeAttendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final FarmAssignmentRepository farmAssignmentRepository;
    private final FarmSecurityEvaluator farmSecurity;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.notification.service.NotificationService notificationService;

    public TimeAttendanceServiceImpl(TimeAttendanceRepository timeAttendanceRepository,
                                    EmployeeRepository employeeRepository,
                                    WorkShiftRepository workShiftRepository,
                                    FarmRepository farmRepository,
                                    UserRepository userRepository) {
        this(timeAttendanceRepository, employeeRepository, workShiftRepository, farmRepository, userRepository, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public TimeAttendanceServiceImpl(TimeAttendanceRepository timeAttendanceRepository,
                                    EmployeeRepository employeeRepository,
                                    WorkShiftRepository workShiftRepository,
                                    FarmRepository farmRepository,
                                    UserRepository userRepository,
                                    @org.springframework.beans.factory.annotation.Autowired(required = false) FarmAssignmentRepository farmAssignmentRepository,
                                    @org.springframework.beans.factory.annotation.Autowired(required = false) FarmSecurityEvaluator farmSecurity) {
        this.timeAttendanceRepository = timeAttendanceRepository;
        this.employeeRepository = employeeRepository;
        this.workShiftRepository = workShiftRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.farmAssignmentRepository = farmAssignmentRepository;
        this.farmSecurity = farmSecurity;
    }

    @Override
    @Transactional
    public CheckInAttendanceResponse checkIn(CheckInAttendanceRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();

        if (currentUser != null && (currentUser.hasRole("ROLE_FARM_OWNER") || (!currentUser.isSuperAdmin() && currentUser.getRoles().contains("ROLE_FARM_OWNER")))) {
            throw new BusinessException("FORBIDDEN", "Chủ trang trại không thực hiện chấm công cá nhân tại trang trại");
        }

        Employee employee = resolveEmployee(tenantId, currentUserId, request.getEmployeeId());
        Farm farm = farmRepository.findById(request.getFarmId())
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        WorkShift shift = workShiftRepository.findById(request.getShiftId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkShift", "id", request.getShiftId()));

        // 1. Geofence Check using Haversine
        double farmLat = farm.getLatitude() != null ? farm.getLatitude().doubleValue() : 0.0;
        double farmLon = farm.getLongitude() != null ? farm.getLongitude().doubleValue() : 0.0;
        double distanceM = GeoDistanceUtils.calculateDistanceMeters(
                request.getLatitude().doubleValue(),
                request.getLongitude().doubleValue(),
                farmLat,
                farmLon
        );

        double radiusM = farm.getGeofenceRadiusM() != null ? farm.getGeofenceRadiusM() : 200.0;
        boolean withinGeofence = distanceM <= radiusM;
        if (!withinGeofence) {
            log.warn("GPS_OUTSIDE_GEOFENCE: employee {} distance {}m > radius {}m for farm {}", employee.getId(), distanceM, radiusM, farm.getId());
            throw new BusinessException("GPS_OUTSIDE_GEOFENCE",
                    String.format("Tọa độ chấm công nằm ngoài phạm vi trang trại (Khoảng cách: %.1fm > Cho phép: %.1fm)", distanceM, radiusM));
        }

        Instant checkInInstant = request.getCheckInTime() != null ? request.getCheckInTime() : Instant.now();
        LocalDate workDate = LocalDate.ofInstant(checkInInstant, VN_ZONE);

        // Check if already checked in today for this shift
        if (timeAttendanceRepository.findByEmployeeIdAndWorkDateAndShiftId(employee.getId(), workDate, shift.getId()).isPresent()) {
            throw new BusinessException("ALREADY_CHECKED_IN_TODAY", "Nhân viên đã chấm công ca này trong ngày " + workDate);
        }

        // 2. Late Minutes Calculation
        LocalTime inTime = LocalTime.ofInstant(checkInInstant, VN_ZONE);
        long diffMinutes = ChronoUnit.MINUTES.between(shift.getStartTime(), inTime);
        int grace = shift.getGraceLateMinutes() != null ? shift.getGraceLateMinutes() : 0;
        int lateMinutes = (int) Math.max(0, diffMinutes - grace);
        String status = lateMinutes > 0 ? "LATE" : "VALID";

        TimeAttendance attendance = TimeAttendance.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .employeeId(employee.getId())
                .shiftId(shift.getId())
                .workDate(workDate)
                .checkInTime(checkInInstant)
                .gpsLatitude(request.getLatitude())
                .gpsLongitude(request.getLongitude())
                .gpsDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP))
                .checkInPhotoUrl(request.getPhotoUrl())
                .workingHours(BigDecimal.ZERO)
                .lateMinutes(lateMinutes)
                .earlyLeaveMinutes(0)
                .deviceInfo(request.getDeviceInfo())
                .status(status)
                .notes(request.getNotes())
                .isAdjusted(false)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        attendance = timeAttendanceRepository.save(attendance);
        log.info("Checked in attendance id={}, employeeId={}, status={}, late={}min", attendance.getId(), employee.getId(), status, lateMinutes);

        return CheckInAttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(employee.getId())
                .employeeFullName(employee.getFullName())
                .employeeCode(employee.getEmployeeCode())
                .farmId(farm.getId())
                .farmName(farm.getName())
                .shiftId(shift.getId())
                .shiftName(shift.getName())
                .workDate(workDate)
                .checkInTime(checkInInstant)
                .checkInPhotoUrl(attendance.getCheckInPhotoUrl())
                .gpsDistanceM(attendance.getGpsDistanceM())
                .isWithinGeofence(true)
                .lateMinutes(lateMinutes)
                .status(status)
                .notes(attendance.getNotes())
                .build();
    }

    @Override
    @Transactional
    public TimeAttendanceDetailResponse checkOut(CheckOutAttendanceRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();

        if (currentUser != null && (currentUser.hasRole("ROLE_FARM_OWNER") || (!currentUser.isSuperAdmin() && currentUser.getRoles().contains("ROLE_FARM_OWNER")))) {
            throw new BusinessException("FORBIDDEN", "Chủ trang trại không thực hiện chấm công cá nhân tại trang trại");
        }

        Employee employee = resolveEmployee(tenantId, currentUserId, request.getEmployeeId());
        Instant checkOutInstant = request.getCheckOutTime() != null ? request.getCheckOutTime() : Instant.now();
        LocalDate workDate = LocalDate.ofInstant(checkOutInstant, VN_ZONE);

        TimeAttendance attendance = timeAttendanceRepository.findByEmployeeIdAndWorkDateAndShiftId(employee.getId(), workDate, request.getShiftId())
                .orElseGet(() -> timeAttendanceRepository.findTopByEmployeeIdAndWorkDateOrderByCheckInTimeDesc(employee.getId(), workDate)
                        .orElseThrow(() -> new BusinessException("CHECK_IN_NOT_FOUND", "Không tìm thấy lượt chấm công vào ca hợp lệ trong ngày " + workDate)));

        WorkShift shift = workShiftRepository.findById(attendance.getShiftId()).orElseThrow();
        Farm farm = farmRepository.findById(attendance.getFarmId()).orElseThrow();

        double farmLat = farm.getLatitude() != null ? farm.getLatitude().doubleValue() : 0.0;
        double farmLon = farm.getLongitude() != null ? farm.getLongitude().doubleValue() : 0.0;
        double distanceM = GeoDistanceUtils.calculateDistanceMeters(
                request.getLatitude().doubleValue(),
                request.getLongitude().doubleValue(),
                farmLat,
                farmLon
        );

        // Calculate working hours & early leave minutes
        long totalMinutes = ChronoUnit.MINUTES.between(attendance.getCheckInTime(), checkOutInstant);
        int breakMinutes = shift.getBreakMinutes() != null ? shift.getBreakMinutes() : 0;
        long netMinutes = Math.max(0, totalMinutes - breakMinutes);
        BigDecimal workingHours = BigDecimal.valueOf(netMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        LocalTime outTime = LocalTime.ofInstant(checkOutInstant, VN_ZONE);
        long earlyDiff = ChronoUnit.MINUTES.between(outTime, shift.getEndTime());
        int earlyLeaveMinutes = (int) Math.max(0, earlyDiff);

        attendance.setCheckOutTime(checkOutInstant);
        attendance.setCheckOutLatitude(request.getLatitude());
        attendance.setCheckOutLongitude(request.getLongitude());
        attendance.setCheckOutDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP));
        attendance.setCheckOutPhotoUrl(request.getPhotoUrl());
        attendance.setWorkingHours(workingHours);
        attendance.setEarlyLeaveMinutes(earlyLeaveMinutes);
        if (request.getNotes() != null) {
            attendance.setNotes(request.getNotes());
        }
        attendance.setUpdatedAt(Instant.now());
        attendance.setUpdatedBy(currentUserId);

        attendance = timeAttendanceRepository.save(attendance);
        log.info("Checked out attendance id={}, hours={}, earlyLeave={}min", attendance.getId(), workingHours, earlyLeaveMinutes);

        return mapToDetailResponse(attendance, employee, shift, farm);
    }

    @Override
    @Transactional
    public TimeAttendanceDetailResponse adjustAttendance(Long id, AdjustAttendanceRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TimeAttendance attendance = timeAttendanceRepository.findById(id)
                .filter(a -> a.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("TimeAttendance", "id", id));

        if (attendance.getOriginalCheckIn() == null) {
            attendance.setOriginalCheckIn(attendance.getCheckInTime());
        }
        if (attendance.getOriginalCheckOut() == null && attendance.getCheckOutTime() != null) {
            attendance.setOriginalCheckOut(attendance.getCheckOutTime());
        }

        if (request.getCheckInTime() != null) {
            attendance.setCheckInTime(request.getCheckInTime());
        }
        if (request.getCheckOutTime() != null) {
            attendance.setCheckOutTime(request.getCheckOutTime());
        }

        WorkShift shift = workShiftRepository.findById(attendance.getShiftId()).orElseThrow();
        if (attendance.getCheckInTime() != null && attendance.getCheckOutTime() != null) {
            long totalMinutes = ChronoUnit.MINUTES.between(attendance.getCheckInTime(), attendance.getCheckOutTime());
            int breakMinutes = shift.getBreakMinutes() != null ? shift.getBreakMinutes() : 0;
            long netMinutes = Math.max(0, totalMinutes - breakMinutes);
            attendance.setWorkingHours(BigDecimal.valueOf(netMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
        }

        if (attendance.getCheckInTime() != null) {
            LocalTime inTime = LocalTime.ofInstant(attendance.getCheckInTime(), VN_ZONE);
            long diffMinutes = ChronoUnit.MINUTES.between(shift.getStartTime(), inTime);
            int grace = shift.getGraceLateMinutes() != null ? shift.getGraceLateMinutes() : 0;
            attendance.setLateMinutes((int) Math.max(0, diffMinutes - grace));
        }

        attendance.setIsAdjusted(true);
        attendance.setAdjustedByUserId(currentUserId);
        attendance.setAdjustmentReason(request.getAdjustmentReason());
        attendance.setUpdatedAt(Instant.now());
        attendance.setUpdatedBy(currentUserId);

        attendance = timeAttendanceRepository.save(attendance);
        log.info("Adjusted attendance id={} by user {}", attendance.getId(), currentUserId);

        Employee emp = employeeRepository.findById(attendance.getEmployeeId()).orElse(null);
        Farm farm = farmRepository.findById(attendance.getFarmId()).orElse(null);
        return mapToDetailResponse(attendance, emp, shift, farm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDetailResponse> getAttendances(Long farmId, LocalDate workDate) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        List<TimeAttendance> attendances = timeAttendanceRepository.findByFarmIdAndWorkDate(farmId, workDate);

        if (user == null || user.isSuperAdmin()
                || user.hasRole("ROLE_FARM_OWNER")
                || user.hasRole("ROLE_FARM_MANAGER")
                || user.hasRole("ROLE_ACCOUNTANT")) {
            return attendances.stream()
                    .map(this::enrichDetailResponse)
                    .collect(Collectors.toList());
        }

        // Check if user is ZONE_MANAGER on this farm
        if (farmAssignmentRepository != null) {
            List<FarmAssignment> userAssignments = farmAssignmentRepository.findByUserIdAndIsActiveTrue(currentUserId);
            Optional<FarmAssignment> zoneMgrAssignment = userAssignments.stream()
                    .filter(a -> a.getFarmId().equals(farmId) && "ZONE_MANAGER".equalsIgnoreCase(a.getRoleInFarm()) && a.getZoneId() != null)
                    .findFirst();

            if (zoneMgrAssignment.isPresent()) {
                Long zoneId = zoneMgrAssignment.get().getZoneId();
                Set<Long> userIdsInZone = farmAssignmentRepository.findByFarmIdAndIsActiveTrue(farmId).stream()
                        .filter(a -> zoneId.equals(a.getZoneId()))
                        .map(FarmAssignment::getUserId)
                        .collect(Collectors.toSet());
                userIdsInZone.add(currentUserId);

                Set<Long> employeeIdsInZone = employeeRepository.findAll().stream()
                        .filter(e -> farmId.equals(e.getFarmId()) && e.getUserId() != null && userIdsInZone.contains(e.getUserId()))
                        .map(Employee::getId)
                        .collect(Collectors.toSet());

                return attendances.stream()
                        .filter(a -> employeeIdsInZone.contains(a.getEmployeeId()))
                        .map(this::enrichDetailResponse)
                        .collect(Collectors.toList());
            }
        }

        // Normal staff (FIELD_WORKER, WAREHOUSE_STAFF, TECHNICAL_STAFF): only see own attendances
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Optional<Employee> myEmp = employeeRepository.findByTenantIdAndUserId(tenantId, currentUserId);
        if (myEmp.isEmpty()) {
            return Collections.emptyList();
        }
        Long myEmpId = myEmp.get().getId();
        return attendances.stream()
                .filter(a -> myEmpId.equals(a.getEmployeeId()))
                .map(this::enrichDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimeAttendanceDetailResponse getAttendanceById(Long id) {
        TimeAttendance attendance = timeAttendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimeAttendance", "id", id));
        return enrichDetailResponse(attendance);
    }

    @Override
    @Transactional
    public BatchRollCallResponse batchRollCall(BatchRollCallRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();

        if (currentUser == null) {
            throw new BusinessException("UNAUTHORIZED", "Người dùng chưa đăng nhập");
        }

        // 1. Kiểm tra quyền: Người gọi phải là FARM_MANAGER, TECHNICAL_STAFF hoặc ZONE_MANAGER / TECHNICAL_LEAD tại farm
        if (farmSecurity != null) {
            if (!farmSecurity.canPerformBatchRollCall(request.getFarmId())) {
                throw new BusinessException("FORBIDDEN",
                        "Chỉ Quản lý trang trại, Kỹ thuật viên hoặc Trưởng phân khu mới có quyền điểm danh theo ca");
            }
        } else {
            boolean isAllowed = currentUser.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_MANAGER", "ROLE_TECHNICAL_STAFF");
            if (!isAllowed) {
                throw new BusinessException("FORBIDDEN",
                        "Chỉ Quản lý trang trại, Kỹ thuật viên hoặc Trưởng phân khu mới có quyền điểm danh theo ca");
            }
        }

        Farm farm = farmRepository.findById(request.getFarmId())
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        WorkShift shift = workShiftRepository.findById(request.getShiftId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkShift", "id", request.getShiftId()));

        // 2. Tính khoảng cách Haversine từ (latitude, longitude) tới tâm trang trại và đối chiếu geofence_radius_m
        double farmLat = farm.getLatitude() != null ? farm.getLatitude().doubleValue() : 0.0;
        double farmLon = farm.getLongitude() != null ? farm.getLongitude().doubleValue() : 0.0;
        double distanceM = GeoDistanceUtils.calculateDistanceMeters(
                request.getLatitude().doubleValue(),
                request.getLongitude().doubleValue(),
                farmLat,
                farmLon
        );

        double radiusM = farm.getGeofenceRadiusM() != null ? farm.getGeofenceRadiusM() : 200.0;
        boolean withinGeofence = distanceM <= radiusM;
        if (!withinGeofence) {
            log.warn("GPS_OUTSIDE_GEOFENCE in batch roll call: distance {}m > radius {}m for farm {}", distanceM, radiusM, farm.getId());
            throw new BusinessException("GPS_OUTSIDE_GEOFENCE",
                    String.format("Tọa độ điểm danh tập thể nằm ngoài phạm vi trang trại (Khoảng cách: %.1fm > Cho phép: %.1fm)", distanceM, radiusM));
        }

        Instant now = Instant.now();
        LocalDate targetWorkDate = request.getWorkDate() != null
                ? request.getWorkDate()
                : LocalDate.ofInstant(now, VN_ZONE);

        String action = request.getActionType().trim().toUpperCase();
        if (!"CHECK_IN".equals(action) && !"CHECK_OUT".equals(action)) {
            throw new BusinessException("INVALID_ACTION_TYPE", "actionType phải là 'CHECK_IN' hoặc 'CHECK_OUT'");
        }

        List<TimeAttendanceDetailResponse> resultList = new ArrayList<>();

        for (Long empId : request.getEmployeeIds()) {
            Employee emp = employeeRepository.findById(empId)
                    .filter(e -> e.getTenantId().equals(tenantId))
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", empId));

            if (emp.getFarmId() == null || !emp.getFarmId().equals(farm.getId())) {
                throw new BusinessException("EMPLOYEE_NOT_IN_FARM",
                        String.format("Nhân viên %s (%s) không thuộc biên chế trang trại này", emp.getFullName(), emp.getEmployeeCode()));
            }

            if ("CHECK_IN".equals(action)) {
                // Kiểm tra xem đã chấm công ca này trong ngày chưa
                Optional<TimeAttendance> existingOpt = timeAttendanceRepository
                        .findByEmployeeIdAndWorkDateAndShiftId(emp.getId(), targetWorkDate, shift.getId());

                TimeAttendance attendance;
                LocalTime inTime = LocalTime.ofInstant(now, VN_ZONE);
                long diffMinutes = ChronoUnit.MINUTES.between(shift.getStartTime(), inTime);
                int grace = shift.getGraceLateMinutes() != null ? shift.getGraceLateMinutes() : 0;
                int lateMinutes = (int) Math.max(0, diffMinutes - grace);
                String status = lateMinutes > 0 ? "LATE" : "VALID";

                if (existingOpt.isPresent()) {
                    attendance = existingOpt.get();
                    attendance.setCheckInTime(now);
                    attendance.setGpsLatitude(request.getLatitude());
                    attendance.setGpsLongitude(request.getLongitude());
                    attendance.setGpsDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP));
                    attendance.setCheckInPhotoUrl(request.getPhotoUrl());
                    attendance.setLateMinutes(lateMinutes);
                    attendance.setStatus(status);
                    if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                    }
                    attendance.setUpdatedAt(now);
                    attendance.setUpdatedBy(currentUserId);
                } else {
                    attendance = TimeAttendance.builder()
                            .tenantId(tenantId)
                            .farmId(farm.getId())
                            .employeeId(emp.getId())
                            .shiftId(shift.getId())
                            .workDate(targetWorkDate)
                            .checkInTime(now)
                            .gpsLatitude(request.getLatitude())
                            .gpsLongitude(request.getLongitude())
                            .gpsDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP))
                            .checkInPhotoUrl(request.getPhotoUrl())
                            .workingHours(BigDecimal.ZERO)
                            .lateMinutes(lateMinutes)
                            .earlyLeaveMinutes(0)
                            .status(status)
                            .notes(request.getNotes())
                            .isAdjusted(false)
                            .createdAt(now)
                            .createdBy(currentUserId)
                            .build();
                }

                attendance = timeAttendanceRepository.save(attendance);
                resultList.add(mapToDetailResponse(attendance, emp, shift, farm));

            } else { // CHECK_OUT
                TimeAttendance attendance = timeAttendanceRepository
                        .findByEmployeeIdAndWorkDateAndShiftId(emp.getId(), targetWorkDate, shift.getId())
                        .orElseGet(() -> timeAttendanceRepository
                                .findTopByEmployeeIdAndWorkDateOrderByCheckInTimeDesc(emp.getId(), targetWorkDate)
                                .orElse(null));

                if (attendance == null) {
                    // Nếu chưa có lượt check-in, tạo bản ghi với check_in_time giả định là shift.startTime
                    LocalTime startTime = shift.getStartTime() != null ? shift.getStartTime() : LocalTime.of(7, 0);
                    Instant assumedCheckIn = targetWorkDate.atTime(startTime).atZone(VN_ZONE).toInstant();
                    attendance = TimeAttendance.builder()
                            .tenantId(tenantId)
                            .farmId(farm.getId())
                            .employeeId(emp.getId())
                            .shiftId(shift.getId())
                            .workDate(targetWorkDate)
                            .checkInTime(assumedCheckIn)
                            .gpsLatitude(request.getLatitude())
                            .gpsLongitude(request.getLongitude())
                            .gpsDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP))
                            .checkInPhotoUrl(request.getPhotoUrl())
                            .workingHours(BigDecimal.ZERO)
                            .lateMinutes(0)
                            .earlyLeaveMinutes(0)
                            .status("VALID")
                            .notes(request.getNotes())
                            .isAdjusted(false)
                            .createdAt(now)
                            .createdBy(currentUserId)
                            .build();
                }

                long totalMinutes = ChronoUnit.MINUTES.between(attendance.getCheckInTime(), now);
                int breakMinutes = shift.getBreakMinutes() != null ? shift.getBreakMinutes() : 0;
                long netMinutes = Math.max(0, totalMinutes - breakMinutes);
                BigDecimal workingHours = BigDecimal.valueOf(netMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

                LocalTime outTime = LocalTime.ofInstant(now, VN_ZONE);
                long earlyDiff = ChronoUnit.MINUTES.between(outTime, shift.getEndTime());
                int earlyLeaveMinutes = (int) Math.max(0, earlyDiff);

                attendance.setCheckOutTime(now);
                attendance.setCheckOutLatitude(request.getLatitude());
                attendance.setCheckOutLongitude(request.getLongitude());
                attendance.setCheckOutDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP));
                attendance.setCheckOutPhotoUrl(request.getPhotoUrl());
                attendance.setWorkingHours(workingHours);
                attendance.setEarlyLeaveMinutes(earlyLeaveMinutes);
                if (request.getNotes() != null) {
                    attendance.setNotes(request.getNotes());
                }
                attendance.setUpdatedAt(now);
                attendance.setUpdatedBy(currentUserId);

                attendance = timeAttendanceRepository.save(attendance);
                resultList.add(mapToDetailResponse(attendance, emp, shift, farm));
            }
        }

        log.info("Completed batchRollCall: action={}, farmId={}, total={}, distance={}m",
                action, farm.getId(), resultList.size(), distanceM);

        // Bắn Notification SYSTEM cho Giám đốc trại và Kế toán trang trại
        if (notificationService != null) {
            try {
                String notifTitle = "Hoàn tất điểm danh tổ hiện trường ngày " + targetWorkDate;
                String notifMsg = "Trưởng phân khu / Tổ trưởng vừa hoàn tất điểm danh hàng loạt cho " + resultList.size() + " nhân sự tại trang trại.";
                Set<Long> recipientUserIds = new HashSet<>();
                if (farm.getManagerUserId() != null && !farm.getManagerUserId().equals(currentUserId)) {
                    recipientUserIds.add(farm.getManagerUserId());
                }
                if (farmAssignmentRepository != null) {
                    farmAssignmentRepository.findByFarmIdAndIsActiveTrue(farm.getId()).stream()
                            .filter(a -> "ACCOUNTANT".equalsIgnoreCase(a.getRoleInFarm()))
                            .map(FarmAssignment::getUserId)
                            .filter(uid -> uid != null && !uid.equals(currentUserId))
                            .forEach(recipientUserIds::add);
                }
                userRepository.findByUsername("accountant")
                        .map(User::getId)
                        .filter(uid -> !uid.equals(currentUserId))
                        .ifPresent(recipientUserIds::add);

                for (Long rId : recipientUserIds) {
                    notificationService.sendNotification(
                            tenantId,
                            rId,
                            notifTitle,
                            notifMsg,
                            "SYSTEM",
                            "BATCH_ROLL_CALL",
                            farm.getId(),
                            "/app/my-dashboard"
                    );
                }
            } catch (Exception ex) {
                log.warn("Failed to send batch roll-call notification: {}", ex.getMessage());
            }
        }

        return BatchRollCallResponse.builder()
                .totalEmployees(request.getEmployeeIds().size())
                .successCount(resultList.size())
                .actionType(action)
                .farmId(farm.getId())
                .farmName(farm.getName())
                .shiftId(shift.getId())
                .shiftName(shift.getName())
                .workDate(targetWorkDate)
                .gpsDistanceM(BigDecimal.valueOf(distanceM).setScale(2, RoundingMode.HALF_UP))
                .isWithinGeofence(true)
                .attendances(resultList)
                .build();
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
            if (farmAssignmentRepository != null) {
                var assignments = farmAssignmentRepository.findByUserId(userId);
                if (assignments != null && !assignments.isEmpty()) {
                    farmId = assignments.get(0).getFarmId();
                }
            }
            if (farmId == null) {
                var farms = farmRepository.findByTenantId(tenantId);
                if (farms != null && !farms.isEmpty()) {
                    farmId = farms.get(0).getId();
                }
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

    private TimeAttendanceDetailResponse enrichDetailResponse(TimeAttendance a) {
        Employee emp = employeeRepository.findById(a.getEmployeeId()).orElse(null);
        WorkShift ws = workShiftRepository.findById(a.getShiftId()).orElse(null);
        Farm farm = farmRepository.findById(a.getFarmId()).orElse(null);
        return mapToDetailResponse(a, emp, ws, farm);
    }

    private TimeAttendanceDetailResponse mapToDetailResponse(TimeAttendance a, Employee emp, WorkShift ws, Farm farm) {
        String adjustedByName = null;
        if (a.getAdjustedByUserId() != null) {
            adjustedByName = userRepository.findById(a.getAdjustedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        return TimeAttendanceDetailResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployeeId())
                .employeeFullName(emp != null ? emp.getFullName() : null)
                .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                .farmId(a.getFarmId())
                .farmName(farm != null ? farm.getName() : null)
                .shiftId(a.getShiftId())
                .shiftName(ws != null ? ws.getName() : null)
                .workDate(a.getWorkDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .gpsLatitude(a.getGpsLatitude())
                .gpsLongitude(a.getGpsLongitude())
                .gpsDistanceM(a.getGpsDistanceM())
                .checkOutLatitude(a.getCheckOutLatitude())
                .checkOutLongitude(a.getCheckOutLongitude())
                .checkOutDistanceM(a.getCheckOutDistanceM())
                .checkInPhotoUrl(a.getCheckInPhotoUrl())
                .checkOutPhotoUrl(a.getCheckOutPhotoUrl())
                .workingHours(a.getWorkingHours())
                .lateMinutes(a.getLateMinutes())
                .earlyLeaveMinutes(a.getEarlyLeaveMinutes())
                .deviceInfo(a.getDeviceInfo())
                .status(a.getStatus())
                .notes(a.getNotes())
                .isAdjusted(a.getIsAdjusted())
                .adjustedByUserId(a.getAdjustedByUserId())
                .adjustedByName(adjustedByName)
                .adjustmentReason(a.getAdjustmentReason())
                .originalCheckIn(a.getOriginalCheckIn())
                .originalCheckOut(a.getOriginalCheckOut())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
