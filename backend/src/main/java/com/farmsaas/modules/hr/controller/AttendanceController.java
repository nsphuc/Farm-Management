package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.hr.dto.AttendanceResponse;
import com.farmsaas.modules.hr.dto.AttendanceSummaryDto;
import com.farmsaas.modules.hr.dto.CheckInRequest;
import com.farmsaas.modules.hr.dto.CheckOutRequest;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
import com.farmsaas.modules.hr.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/attendance", "/api/v1/farms/{farmId}/attendances"})
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @PathVariable Long farmId,
            @Valid @RequestBody CheckInRequest request
    ) {
        AttendanceResponse response = attendanceService.checkIn(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Check-in chấm công thành công."));
    }

    @PostMapping("/check-out")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long attendanceId,
            @Valid @RequestBody CheckOutRequest request
    ) {
        AttendanceResponse response = attendanceService.checkOut(farmId, attendanceId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Check-out chấm công thành công."));
    }

    @GetMapping("/today")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getTodayAttendance(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long employeeId
    ) {
        AttendanceResponse response = attendanceService.getTodayAttendance(farmId, employeeId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy trạng thái chấm công hôm nay thành công."));
    }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttendanceSummaryDto>> getAttendanceSummary(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        AttendanceSummaryDto summary = attendanceService.getAttendanceSummary(farmId, employeeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy tổng hợp công thành công."));
    }

    @GetMapping({"", "/search"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> searchAttendance(
            @PathVariable Long farmId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "workDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AttendanceResponse> result = attendanceService.searchAttendance(farmId, startDate, endDate, employeeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm dữ liệu chấm công thành công."));
    }
}
