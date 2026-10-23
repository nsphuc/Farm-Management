package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateWorkShiftRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateWorkShiftRequest;
import com.farm.saas.modules.masterdata.dto.response.WorkShiftResponse;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hr/shifts")
@RequiredArgsConstructor
public class WorkShiftController {

    private final MasterCatalogService masterCatalogService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_HR_ATTENDANCE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<List<WorkShiftResponse>> getWorkShifts() {
        return ResponseEntity.ok(masterCatalogService.getWorkShifts());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<WorkShiftResponse> createWorkShift(@Valid @RequestBody CreateWorkShiftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterCatalogService.createWorkShift(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    public ResponseEntity<WorkShiftResponse> updateWorkShift(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkShiftRequest request) {
        return ResponseEntity.ok(masterCatalogService.updateWorkShift(id, request));
    }
}
