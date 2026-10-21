package com.farm.saas;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.dto.request.BatchRollCallRequest;
import com.farm.saas.modules.hr.dto.response.BatchRollCallResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.TimeAttendance;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.TimeAttendanceRepository;
import com.farm.saas.modules.hr.service.impl.TimeAttendanceServiceImpl;
import com.farm.saas.modules.masterdata.entity.WorkShift;
import com.farm.saas.modules.masterdata.repository.WorkShiftRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class BatchRollCallAttendanceTest {

    private TimeAttendanceRepository timeAttendanceRepository;
    private EmployeeRepository employeeRepository;
    private WorkShiftRepository workShiftRepository;
    private FarmRepository farmRepository;
    private UserRepository userRepository;
    private TimeAttendanceServiceImpl timeAttendanceService;

    private Farm farm1;
    private WorkShift morningShift;
    private Employee worker1;
    private Employee worker2;

    @BeforeEach
    void setUp() {
        timeAttendanceRepository = Mockito.mock(TimeAttendanceRepository.class);
        employeeRepository = Mockito.mock(EmployeeRepository.class);
        workShiftRepository = Mockito.mock(WorkShiftRepository.class);
        farmRepository = Mockito.mock(FarmRepository.class);
        userRepository = Mockito.mock(UserRepository.class);

        timeAttendanceService = new TimeAttendanceServiceImpl(
                timeAttendanceRepository,
                employeeRepository,
                workShiftRepository,
                farmRepository,
                userRepository
        );

        // Farm 1: Tọa độ Hà Nội/Bắc Ninh (21.0285, 105.8542), bán kính Geofence 500m
        farm1 = Farm.builder()
                .id(1L)
                .tenantId(10L)
                .name("Trang Trại Bắc Ninh")
                .latitude(new BigDecimal("21.028511"))
                .longitude(new BigDecimal("105.854167"))
                .geofenceRadiusM(500)
                .status("ACTIVE")
                .build();
        when(farmRepository.findById(1L)).thenReturn(Optional.of(farm1));

        // Ca sáng: 07:00 - 15:30, ân hạn 15 phút
        morningShift = WorkShift.builder()
                .id(101L)
                .tenantId(10L)
                .name("Ca Sáng Nông Nghiệp")
                .shiftCode("SHIFT-MORNING")
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(15, 30))
                .breakMinutes(60)
                .graceLateMinutes(15)
                .isOvernight(false)
                .build();
        when(workShiftRepository.findById(101L)).thenReturn(Optional.of(morningShift));

        // Công nhân 1: Lao động thời vụ (user_id = null)
        worker1 = Employee.builder()
                .id(201L)
                .tenantId(10L)
                .farmId(1L)
                .employeeCode("EMP-TV-01")
                .fullName("Trần Văn Thời Vụ 1")
                .position("SEASONAL_NO_ACCOUNT")
                .userId(null)
                .build();
        when(employeeRepository.findById(201L)).thenReturn(Optional.of(worker1));

        // Công nhân 2: Lao động thời vụ (user_id = null)
        worker2 = Employee.builder()
                .id(202L)
                .tenantId(10L)
                .farmId(1L)
                .employeeCode("EMP-TV-02")
                .fullName("Lê Thị Thời Vụ 2")
                .position("SEASONAL_NO_ACCOUNT")
                .userId(null)
                .build();
        when(employeeRepository.findById(202L)).thenReturn(Optional.of(worker2));

        when(timeAttendanceRepository.save(any(TimeAttendance.class))).thenAnswer(invocation -> {
            TimeAttendance att = invocation.getArgument(0);
            if (att.getId() == null) {
                att.setId(999L);
            }
            return att;
        });

        // Thiết lập người dùng đăng nhập là Kỹ sư kỹ thuật / Trưởng khu (ROLE_TECHNICAL_STAFF)
        setAuthenticatedUser(15L, 10L, Set.of("ROLE_TECHNICAL_STAFF"), Set.of(1L));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(Long userId, Long tenantId, Set<String> roles, Set<Long> accessibleFarms) {
        CustomUserDetails user = CustomUserDetails.builder()
                .id(userId)
                .tenantId(tenantId)
                .username("truong_khu_01")
                .roles(roles)
                .accessibleFarmIds(accessibleFarms)
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Điểm danh vào ca tập thể (CHECK_IN) thành công cho công nhân không có tài khoản")
    void testBatchRollCallCheckInSuccess() {
        BatchRollCallRequest request = BatchRollCallRequest.builder()
                .farmId(1L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .actionType("CHECK_IN")
                .employeeIds(List.of(201L, 202L))
                // Tọa độ gần tâm trại (~15m, nằm trọn trong 500m geofence)
                .latitude(new BigDecimal("21.028600"))
                .longitude(new BigDecimal("105.854200"))
                .photoUrl("https://images.nongtrai.vn/rollcall/checkin_team1.jpg")
                .notes("Tổ làm cỏ luống số 3 điểm danh đủ 2 người")
                .build();

        BatchRollCallResponse response = timeAttendanceService.batchRollCall(request);

        assertNotNull(response);
        assertEquals(2, response.getTotalEmployees());
        assertEquals(2, response.getSuccessCount());
        assertEquals("CHECK_IN", response.getActionType());
        assertTrue(response.isWithinGeofence());
        assertEquals(2, response.getAttendances().size());
        assertEquals("Trần Văn Thời Vụ 1", response.getAttendances().get(0).getEmployeeFullName());
        assertEquals("Lê Thị Thời Vụ 2", response.getAttendances().get(1).getEmployeeFullName());
    }

    @Test
    @DisplayName("Điểm danh tan ca tập thể (CHECK_OUT) tự động tính giờ công và giờ về sớm")
    void testBatchRollCallCheckOutSuccess() {
        // Giả lập worker1 đã có lượt check-in lúc 07:00 sáng nay
        Instant checkIn7am = LocalDate.now().atTime(7, 0).atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        TimeAttendance existingAtt = TimeAttendance.builder()
                .id(1001L)
                .tenantId(10L)
                .farmId(1L)
                .employeeId(201L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .checkInTime(checkIn7am)
                .build();
        when(timeAttendanceRepository.findByEmployeeIdAndWorkDateAndShiftId(201L, LocalDate.now(), 101L))
                .thenReturn(Optional.of(existingAtt));

        BatchRollCallRequest request = BatchRollCallRequest.builder()
                .farmId(1L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .actionType("CHECK_OUT")
                .employeeIds(List.of(201L))
                .latitude(new BigDecimal("21.028600"))
                .longitude(new BigDecimal("105.854200"))
                .photoUrl("https://images.nongtrai.vn/rollcall/checkout_team1.jpg")
                .notes("Tan ca chiều")
                .build();

        BatchRollCallResponse response = timeAttendanceService.batchRollCall(request);

        assertNotNull(response);
        assertEquals(1, response.getSuccessCount());
        assertEquals("CHECK_OUT", response.getActionType());
        assertNotNull(response.getAttendances().get(0).getCheckOutTime());
    }

    @Test
    @DisplayName("Điểm danh tập thể ngoài phạm vi Geofence ném lỗi GPS_OUTSIDE_GEOFENCE")
    void testBatchRollCallOutsideGeofenceThrowsException() {
        BatchRollCallRequest request = BatchRollCallRequest.builder()
                .farmId(1L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .actionType("CHECK_IN")
                .employeeIds(List.of(201L))
                // Tọa độ cách xa 10km (ngoài bán kính 500m)
                .latitude(new BigDecimal("21.150000"))
                .longitude(new BigDecimal("105.950000"))
                .photoUrl("https://images.nongtrai.vn/rollcall/checkin_team1.jpg")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> timeAttendanceService.batchRollCall(request));
        assertEquals("GPS_OUTSIDE_GEOFENCE", ex.getErrorCode());
    }

    @Test
    @DisplayName("Nhân viên không có quyền quản lý/kỹ thuật/kho ném lỗi FORBIDDEN khi điểm danh hộ")
    void testBatchRollCallUnauthorizedRoleThrowsException() {
        // Gán role là nhân viên hiện trường (ROLE_FIELD_STAFF) không có quyền roll-call hộ
        setAuthenticatedUser(99L, 10L, Set.of("ROLE_FIELD_STAFF"), Set.of(1L));

        BatchRollCallRequest request = BatchRollCallRequest.builder()
                .farmId(1L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .actionType("CHECK_IN")
                .employeeIds(List.of(201L))
                .latitude(new BigDecimal("21.028600"))
                .longitude(new BigDecimal("105.854200"))
                .photoUrl("https://images.nongtrai.vn/rollcall/checkin_team1.jpg")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> timeAttendanceService.batchRollCall(request));
        assertEquals("FORBIDDEN", ex.getErrorCode());
    }

    @Test
    @DisplayName("Điểm danh nhân viên thuộc trang trại khác ném lỗi EMPLOYEE_NOT_IN_FARM")
    void testBatchRollCallCrossFarmEmployeeThrowsException() {
        // Worker 3 thuộc Farm 2 (Đà Lạt)
        Employee workerFarm2 = Employee.builder()
                .id(203L)
                .tenantId(10L)
                .farmId(2L) // Farm 2
                .employeeCode("EMP-DL-03")
                .fullName("Phạm Văn Đà Lạt")
                .build();
        when(employeeRepository.findById(203L)).thenReturn(Optional.of(workerFarm2));

        BatchRollCallRequest request = BatchRollCallRequest.builder()
                .farmId(1L)
                .shiftId(101L)
                .workDate(LocalDate.now())
                .actionType("CHECK_IN")
                .employeeIds(List.of(203L))
                .latitude(new BigDecimal("21.028600"))
                .longitude(new BigDecimal("105.854200"))
                .photoUrl("https://images.nongtrai.vn/rollcall/checkin_team1.jpg")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> timeAttendanceService.batchRollCall(request));
        assertEquals("EMPLOYEE_NOT_IN_FARM", ex.getErrorCode());
    }
}
