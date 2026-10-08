package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.hr.dto.*;
import com.farmsaas.modules.hr.entity.enums.RequestStatus;
import com.farmsaas.modules.hr.service.LeaveOvertimeService;
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
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
public class LeaveOvertimeController {

    private final LeaveOvertimeService leaveOvertimeService;

    // --- NGHỈ PHÉP (LEAVES) ---

    @GetMapping({"/leaves", "/leave-requests"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> searchLeaves(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<LeaveResponse> result = leaveOvertimeService.searchLeaves(farmId, employeeId, status, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm đơn nghỉ phép thành công."));
    }

    @PostMapping({"/leaves", "/leave-requests"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveResponse>> createLeaveRequest(
            @PathVariable Long farmId,
            @Valid @RequestBody LeaveRequestDto request
    ) {
        LeaveResponse response = leaveOvertimeService.createLeaveRequest(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gửi đơn xin nghỉ phép thành công."));
    }

    @RequestMapping(value = {"/leaves/{leaveId}/review", "/leave-requests/{leaveId}/review"}, method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LeaveResponse>> reviewLeaveRequest(
            @PathVariable Long farmId,
            @PathVariable Long leaveId,
            @Valid @RequestBody ApproveRejectRequest request
    ) {
        LeaveResponse response = leaveOvertimeService.approveOrRejectLeave(farmId, leaveId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Phê duyệt/từ chối đơn nghỉ phép thành công."));
    }

    // --- TĂNG CA (OVERTIME) ---

    @GetMapping({"/overtime", "/overtime-requests"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<OvertimeResponse>>> searchOvertime(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("overtimeDate").descending());
        Page<OvertimeResponse> result = leaveOvertimeService.searchOvertime(farmId, employeeId, status, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm đơn tăng ca thành công."));
    }

    @PostMapping({"/overtime", "/overtime-requests"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OvertimeResponse>> createOvertimeRequest(
            @PathVariable Long farmId,
            @Valid @RequestBody OvertimeRequestDto request
    ) {
        OvertimeResponse response = leaveOvertimeService.createOvertimeRequest(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gửi đăng ký tăng ca thành công."));
    }

    @RequestMapping(value = {"/overtime/{overtimeId}/review", "/overtime-requests/{overtimeId}/review"}, method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<OvertimeResponse>> reviewOvertimeRequest(
            @PathVariable Long farmId,
            @PathVariable Long overtimeId,
            @Valid @RequestBody ApproveRejectRequest request
    ) {
        OvertimeResponse response = leaveOvertimeService.approveOrRejectOvertime(farmId, overtimeId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Phê duyệt/từ chối đơn tăng ca thành công."));
    }
}
