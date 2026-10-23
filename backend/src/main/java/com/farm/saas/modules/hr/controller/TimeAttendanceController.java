package com.farm.saas.modules.hr.controller;

import com.farm.saas.modules.hr.dto.request.AdjustAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.CheckInAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.CheckOutAttendanceRequest;
import com.farm.saas.modules.hr.dto.response.CheckInAttendanceResponse;
import com.farm.saas.modules.hr.dto.response.TimeAttendanceDetailResponse;
import com.farm.saas.modules.hr.service.TimeAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hr/attendance")
@RequiredArgsConstructor
public class TimeAttendanceController {

    private final TimeAttendanceService timeAttendanceService;

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('PERM_HR_ATTENDANCE') and !hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<CheckInAttendanceResponse> checkIn(@Valid @RequestBody CheckInAttendanceRequest request) {
        CheckInAttendanceResponse response = timeAttendanceService.checkIn(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('PERM_HR_ATTENDANCE') and !hasRole('ROLE_FARM_OWNER')")
    public ResponseEntity<TimeAttendanceDetailResponse> checkOut(@Valid @RequestBody CheckOutAttendanceRequest request) {
        TimeAttendanceDetailResponse response = timeAttendanceService.checkOut(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/batch-roll-call")
    @PreAuthorize("hasAuthority('PERM_HR_ATTENDANCE') and @farmSecurity.canPerformBatchRollCall(#request.farmId)")
    public ResponseEntity<com.farm.saas.modules.hr.dto.response.BatchRollCallResponse> batchRollCall(
            @Valid @RequestBody com.farm.saas.modules.hr.dto.request.BatchRollCallRequest request) {
        com.farm.saas.modules.hr.dto.response.BatchRollCallResponse response = timeAttendanceService.batchRollCall(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/adjust")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') and hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<TimeAttendanceDetailResponse> adjustAttendance(
            @PathVariable Long id,
            @Valid @RequestBody AdjustAttendanceRequest request) {
        return ResponseEntity.ok(timeAttendanceService.adjustAttendance(id, request));
    }

    @GetMapping
    @PreAuthorize("(hasAuthority('PERM_HR_ATTENDANCE') or hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<TimeAttendanceDetailResponse>> getAttendances(
            @RequestParam Long farmId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate) {
        return ResponseEntity.ok(timeAttendanceService.getAttendances(farmId, workDate));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HR_ATTENDANCE', 'PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<TimeAttendanceDetailResponse> getAttendanceById(@PathVariable Long id) {
        return ResponseEntity.ok(timeAttendanceService.getAttendanceById(id));
    }
}
