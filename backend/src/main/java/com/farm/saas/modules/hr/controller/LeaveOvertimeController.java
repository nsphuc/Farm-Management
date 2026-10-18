package com.farm.saas.modules.hr.controller;

import com.farm.saas.modules.hr.dto.request.ApproveLeaveRequest;
import com.farm.saas.modules.hr.dto.request.ApproveOvertimeRequest;
import com.farm.saas.modules.hr.dto.request.CreateLeaveRequest;
import com.farm.saas.modules.hr.dto.request.CreateOvertimeRequest;
import com.farm.saas.modules.hr.dto.response.LeaveRequestDetailResponse;
import com.farm.saas.modules.hr.dto.response.OvertimeRequestDetailResponse;
import com.farm.saas.modules.hr.service.LeaveOvertimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr")
@RequiredArgsConstructor
public class LeaveOvertimeController {

    private final LeaveOvertimeService leaveOvertimeService;

    // --- LEAVE ENDPOINTS ---

    @PostMapping("/leaves")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaveRequestDetailResponse> createLeaveRequest(@Valid @RequestBody CreateLeaveRequest request) {
        LeaveRequestDetailResponse response = leaveOvertimeService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/leaves/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")
    public ResponseEntity<LeaveRequestDetailResponse> approveLeaveRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApproveLeaveRequest request) {
        return ResponseEntity.ok(leaveOvertimeService.approveLeaveRequest(id, request));
    }

    @GetMapping("/leaves")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<LeaveRequestDetailResponse>> getLeaveRequests(
            @RequestParam(required = false) Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(leaveOvertimeService.getLeaveRequests(farmId, pageable));
    }

    @GetMapping("/leaves/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaveRequestDetailResponse> getLeaveRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveOvertimeService.getLeaveRequestById(id));
    }

    // --- OVERTIME ENDPOINTS ---

    @PostMapping("/overtime")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OvertimeRequestDetailResponse> createOvertimeRequest(@Valid @RequestBody CreateOvertimeRequest request) {
        OvertimeRequestDetailResponse response = leaveOvertimeService.createOvertimeRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/overtime/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")
    public ResponseEntity<OvertimeRequestDetailResponse> approveOvertimeRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApproveOvertimeRequest request) {
        return ResponseEntity.ok(leaveOvertimeService.approveOvertimeRequest(id, request));
    }

    @GetMapping("/overtime")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<OvertimeRequestDetailResponse>> getOvertimeRequests(
            @RequestParam(required = false) Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(leaveOvertimeService.getOvertimeRequests(farmId, pageable));
    }

    @GetMapping("/overtime/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OvertimeRequestDetailResponse> getOvertimeRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveOvertimeService.getOvertimeRequestById(id));
    }
}
