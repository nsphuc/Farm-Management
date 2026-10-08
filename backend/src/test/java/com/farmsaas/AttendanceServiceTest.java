package com.farmsaas;

import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.modules.hr.dto.*;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
import com.farmsaas.modules.hr.entity.enums.ContractType;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import com.farmsaas.modules.hr.service.AttendanceService;
import com.farmsaas.modules.hr.service.EmployeeService;
import com.farmsaas.modules.hr.service.WorkShiftService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class AttendanceServiceTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private WorkShiftService workShiftService;

    @Autowired
    private AttendanceService attendanceService;

    private Long testTenantId;
    private Long testFarmId;
    private Long testEmployeeId;
    private Long testShiftId;

    @BeforeEach
    void setUp() {
        testTenantId = 1L;
        TenantContextHolder.setTenantId(testTenantId);

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateFarmRequest farmReq = CreateFarmRequest.builder()
                .code("FARM-HR-" + uniqueSuffix)
                .name("Trang Trại HR Test " + uniqueSuffix)
                .farmType("HON_HOP")
                .address("123 Nông Trường Mộc Châu")
                .totalAreaM2(new BigDecimal("50000.00"))
                .latitude(new BigDecimal("20.8400000"))
                .longitude(new BigDecimal("104.6500000"))
                .build();
        FarmResponse farmRes = farmService.createFarm(farmReq);
        testFarmId = farmRes.getId();

        // Tạo ca làm việc
        WorkShiftRequest shiftReq = WorkShiftRequest.builder()
                .shiftCode("CA-SANG-" + uniqueSuffix)
                .shiftName("Ca sáng tiêu chuẩn")
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(15, 30))
                .breakMinutes(30)
                .workingHours(new BigDecimal("8.00"))
                .lateGraceMinutes(15)
                .earlyLeaveGraceMinutes(15)
                .build();
        WorkShiftResponse shiftRes = workShiftService.createShift(testFarmId, shiftReq);
        testShiftId = shiftRes.getId();

        // Tạo nhân viên
        EmployeeRequest empReq = EmployeeRequest.builder()
                .employeeCode("NV-" + uniqueSuffix)
                .fullName("Nguyễn Văn Nghiệp Vụ")
                .contractType(ContractType.FULL_TIME)
                .joinDate(LocalDate.now().minusMonths(6))
                .basicSalary(new BigDecimal("12000000.00"))
                .dailyAllowance(new BigDecimal("50000.00"))
                .department("Nông vụ")
                .position("Kỹ thuật viên")
                .status(EmployeeStatus.ACTIVE)
                .build();
        EmployeeResponse empRes = employeeService.createEmployee(testFarmId, empReq);
        testEmployeeId = empRes.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Check-in GPS trong bán kính hợp lệ (<= 500m) thành công")
    void testCheckInWithinRadius() {
        // Tọa độ rất gần với cổng trang trại (~ 50 mét)
        CheckInRequest checkInReq = CheckInRequest.builder()
                .employeeId(testEmployeeId)
                .shiftId(testShiftId)
                .latitude(new BigDecimal("20.8403000"))
                .longitude(new BigDecimal("104.6502000"))
                .notes("Check-in cổng chính")
                .build();

        AttendanceResponse res = attendanceService.checkIn(testFarmId, checkInReq);

        assertNotNull(res);
        assertNotNull(res.getId());
        assertEquals(testEmployeeId, res.getEmployeeId());
        assertTrue(res.getCheckInDistanceM().compareTo(new BigDecimal("500")) <= 0);
        assertNotEquals(AttendanceStatus.NGOAI_BAN_KINH, res.getStatus());
    }

    @Test
    @Transactional
    @DisplayName("Check-in GPS ngoài bán kính (> 500m) được ghi nhận trạng thái NGOAI_BAN_KINH")
    void testCheckInOutOfRadius() {
        // Tọa độ cách xa hơn 5km
        CheckInRequest checkInReq = CheckInRequest.builder()
                .employeeId(testEmployeeId)
                .shiftId(testShiftId)
                .latitude(new BigDecimal("20.9000000"))
                .longitude(new BigDecimal("104.7000000"))
                .notes("Check-in từ xa")
                .build();

        AttendanceResponse res = attendanceService.checkIn(testFarmId, checkInReq);

        assertNotNull(res);
        assertEquals(AttendanceStatus.NGOAI_BAN_KINH, res.getStatus());
        assertTrue(res.getCheckInDistanceM().compareTo(new BigDecimal("500")) > 0);
    }

    @Test
    @Transactional
    @DisplayName("Check-out hoàn tất và tính toán thời gian làm việc")
    void testCheckOutCalculatesHours() {
        CheckInRequest checkInReq = CheckInRequest.builder()
                .employeeId(testEmployeeId)
                .shiftId(testShiftId)
                .latitude(new BigDecimal("20.8400000"))
                .longitude(new BigDecimal("104.6500000"))
                .build();

        AttendanceResponse checkInRes = attendanceService.checkIn(testFarmId, checkInReq);

        CheckOutRequest checkOutReq = CheckOutRequest.builder()
                .employeeId(testEmployeeId)
                .latitude(new BigDecimal("20.8400500"))
                .longitude(new BigDecimal("104.6500500"))
                .notes("Kết thúc ca làm")
                .build();

        AttendanceResponse checkOutRes = attendanceService.checkOut(testFarmId, checkInRes.getId(), checkOutReq);

        assertNotNull(checkOutRes);
        assertNotNull(checkOutRes.getCheckOutTime());
        assertNotNull(checkOutRes.getWorkingHours());
    }
}
