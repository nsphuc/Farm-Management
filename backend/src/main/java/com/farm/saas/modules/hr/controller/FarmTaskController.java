package com.farm.saas.modules.hr.controller;

import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.request.UpdateTaskStatusRequest;
import com.farm.saas.modules.hr.dto.response.FarmTaskDetailResponse;
import com.farm.saas.modules.hr.service.FarmTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FarmTaskController {

    private final FarmTaskService farmTaskService;

    @PostMapping("/api/v1/farms/{farmId}/tasks")
    @PreAuthorize("(hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF') or hasAuthority('PERM_TASK_ASSIGN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmTaskDetailResponse> createTask(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateFarmTaskRequest request) {
        FarmTaskDetailResponse response = farmTaskService.createTask(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/v1/farms/{farmId}/tasks/generate-daily-routines")
    @PreAuthorize("(hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF') or hasAuthority('PERM_TASK_ASSIGN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<FarmTaskDetailResponse>> generateDailyRoutines(
            @PathVariable Long farmId) {
        return ResponseEntity.ok(farmTaskService.generateDailyRoutines(farmId));
    }

    @PutMapping("/api/v1/farms/{farmId}/tasks/{id}")
    @PreAuthorize("(hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF') or hasAuthority('PERM_TASK_ASSIGN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmTaskDetailResponse> updateTask(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody CreateFarmTaskRequest request) {
        return ResponseEntity.ok(farmTaskService.updateTask(farmId, id, request));
    }

    @DeleteMapping("/api/v1/farms/{farmId}/tasks/{id}")
    @PreAuthorize("(hasAnyRole('ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF') or hasAuthority('PERM_TASK_ASSIGN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        farmTaskService.deleteTask(farmId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/farms/{farmId}/tasks")
    @PreAuthorize("isAuthenticated() and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<FarmTaskDetailResponse>> getTasks(
            @PathVariable Long farmId,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isRoutine,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(farmTaskService.getTasks(farmId, taskType, status, isRoutine, zoneId, employeeId, search, pageable));
    }

    @GetMapping("/api/v1/farms/{farmId}/tasks/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FarmTaskDetailResponse> getTaskById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(farmTaskService.getTaskById(id));
    }

    @PutMapping("/api/v1/tasks/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FarmTaskDetailResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(farmTaskService.updateTaskStatus(id, request));
    }
}
