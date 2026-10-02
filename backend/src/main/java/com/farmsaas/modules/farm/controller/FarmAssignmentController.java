package com.farmsaas.modules.farm.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.farm.dto.AssignmentResponse;
import com.farmsaas.modules.farm.dto.CreateAssignmentRequest;
import com.farmsaas.modules.farm.service.FarmAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/assignments")
@RequiredArgsConstructor
public class FarmAssignmentController {

    private final FarmAssignmentService farmAssignmentService;

    @GetMapping
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignments(@PathVariable Long farmId) {
        List<AssignmentResponse> list = farmAssignmentService.getAssignmentsByFarmId(farmId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phân công nhân sự thành công."));
    }

    @PostMapping
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateAssignmentRequest request
    ) {
        AssignmentResponse response = farmAssignmentService.createAssignment(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Phân công nhân sự thành công."));
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<Void>> revokeAssignment(
            @PathVariable Long farmId,
            @PathVariable Long assignmentId
    ) {
        farmAssignmentService.revokeAssignment(farmId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Thu hồi phân công nhân sự thành công."));
    }
}
