package com.farm.saas.modules.hr.controller;

import com.farm.saas.modules.hr.dto.request.AssignShiftRequest;
import com.farm.saas.modules.hr.dto.response.ShiftAssignmentResponse;
import com.farm.saas.modules.hr.service.ShiftAssignmentService;
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
@RequestMapping("/api/v1/hr/shifts")
@RequiredArgsConstructor
public class ShiftAssignmentController {

    private final ShiftAssignmentService shiftAssignmentService;

    @PostMapping("/assign")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")
    public ResponseEntity<ShiftAssignmentResponse> assignShift(@Valid @RequestBody AssignShiftRequest request) {
        ShiftAssignmentResponse response = shiftAssignmentService.assignShift(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")
    public ResponseEntity<List<ShiftAssignmentResponse>> getAssignments(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate) {
        if (employeeId != null) {
            return ResponseEntity.ok(shiftAssignmentService.getAssignmentsByEmployeeAndDate(employeeId, workDate));
        }
        return ResponseEntity.ok(shiftAssignmentService.getAssignmentsByFarmAndDate(farmId, workDate));
    }
}
