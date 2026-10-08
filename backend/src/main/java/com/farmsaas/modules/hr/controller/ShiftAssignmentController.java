package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.hr.dto.ShiftAssignmentRequest;
import com.farmsaas.modules.hr.dto.ShiftAssignmentResponse;
import com.farmsaas.modules.hr.service.ShiftAssignmentService;
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
@RequestMapping("/api/v1/farms/{farmId}/shift-assignments")
@RequiredArgsConstructor
public class ShiftAssignmentController {

    private final ShiftAssignmentService shiftAssignmentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ShiftAssignmentResponse>>> getRosterSchedule(
            @PathVariable Long farmId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long shiftId
    ) {
        List<ShiftAssignmentResponse> schedule = shiftAssignmentService.getRosterSchedule(farmId, startDate, endDate, employeeId, shiftId);
        return ResponseEntity.ok(ApiResponse.success(schedule, "Lấy lịch phân ca thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<ShiftAssignmentResponse>> assignShift(
            @PathVariable Long farmId,
            @Valid @RequestBody ShiftAssignmentRequest request
    ) {
        ShiftAssignmentResponse response = shiftAssignmentService.assignShift(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Phân ca làm việc thành công."));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<List<ShiftAssignmentResponse>>> batchAssignShifts(
            @PathVariable Long farmId,
            @Valid @RequestBody ShiftAssignmentRequest request
    ) {
        List<ShiftAssignmentResponse> response = shiftAssignmentService.batchAssignShifts(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Phân ca hàng loạt thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        shiftAssignmentService.cancelOrDeleteAssignment(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Hủy phân ca thành công."));
    }
}
