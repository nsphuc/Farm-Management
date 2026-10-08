package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.AttendanceResponse;
import com.farmsaas.modules.hr.dto.AttendanceSummaryDto;
import com.farmsaas.modules.hr.dto.CheckInRequest;
import com.farmsaas.modules.hr.dto.CheckOutRequest;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AttendanceService {

    AttendanceResponse checkIn(Long farmId, CheckInRequest request);

    AttendanceResponse checkOut(Long farmId, Long attendanceId, CheckOutRequest request);

    AttendanceResponse getTodayAttendance(Long farmId, Long employeeId);

    Page<AttendanceResponse> searchAttendance(Long farmId, LocalDate startDate, LocalDate endDate, Long employeeId, AttendanceStatus status, Pageable pageable);

    AttendanceSummaryDto getAttendanceSummary(Long farmId, Long employeeId, LocalDate startDate, LocalDate endDate);
}
