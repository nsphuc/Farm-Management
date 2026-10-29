package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest;
import com.farm.saas.modules.geography.dto.request.CreateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmSettingsRequest;
import com.farm.saas.modules.geography.dto.request.UpdateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.response.FarmAssignmentResponse;
import com.farm.saas.modules.geography.dto.response.FarmOperationalSettingResponse;
import com.farm.saas.modules.geography.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.geography.service.FarmOperationsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
public class FarmOperationsController {

    private final FarmOperationsService farmOperationsService;

    // --- Phân công nhân sự (Assignments) ---

    @GetMapping("/assignments")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<FarmAssignmentResponse>> getAssignments(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmOperationsService.getAssignments(farmId));
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmAssignmentResponse> createAssignment(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateFarmAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmOperationsService.createAssignment(farmId, request));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long farmId,
            @PathVariable Long assignmentId,
            @RequestParam(required = false) Long employeeId) {
        farmOperationsService.deleteAssignment(farmId, assignmentId, employeeId);
        return ResponseEntity.noContent().build();
    }

    // --- Chu kỳ vận hành (Cycles) ---

    @GetMapping("/cycles")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<OperationalCycleResponse>> getCycles(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmOperationsService.getCycles(farmId));
    }

    @PostMapping("/cycles")
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<OperationalCycleResponse> createCycle(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateOperationalCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmOperationsService.createCycle(farmId, request));
    }

    @PutMapping({"/cycles/{cycleId}", "/operations/cycles/{cycleId}"})
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<OperationalCycleResponse> updateCycle(
            @PathVariable Long farmId,
            @PathVariable Long cycleId,
            @Valid @RequestBody UpdateOperationalCycleRequest request) {
        return ResponseEntity.ok(farmOperationsService.updateCycle(farmId, cycleId, request));
    }

    @DeleteMapping({"/cycles/{cycleId}", "/operations/cycles/{cycleId}"})
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Void> deleteCycle(
            @PathVariable Long farmId,
            @PathVariable Long cycleId) {
        farmOperationsService.deleteCycle(farmId, cycleId);
        return ResponseEntity.noContent().build();
    }

    // --- Cài đặt vận hành trang trại (Settings) ---

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmOperationalSettingResponse> getSettings(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmOperationsService.getSettings(farmId));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmOperationalSettingResponse> updateSettings(
            @PathVariable Long farmId,
            @RequestBody UpdateFarmSettingsRequest request) {
        return ResponseEntity.ok(farmOperationsService.updateSettings(farmId, request));
    }
}
