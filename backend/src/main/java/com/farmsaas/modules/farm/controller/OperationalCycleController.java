package com.farmsaas.modules.farm.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.farm.dto.*;
import com.farmsaas.modules.farm.service.OperationalCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
public class OperationalCycleController {

    private final OperationalCycleService operationalCycleService;

    // Cycles Endpoints
    @GetMapping("/cycles")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<List<CycleResponse>>> getCycles(@PathVariable Long farmId) {
        List<CycleResponse> cycles = operationalCycleService.getCyclesByFarmId(farmId);
        return ResponseEntity.ok(ApiResponse.success(cycles, "Lấy danh sách chu kỳ vận hành thành công."));
    }

    @PostMapping("/cycles")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<CycleResponse>> createCycle(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateCycleRequest request
    ) {
        CycleResponse response = operationalCycleService.createCycle(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo chu kỳ vận hành mới thành công."));
    }

    @PutMapping("/cycles/{cycleId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<CycleResponse>> updateCycle(
            @PathVariable Long farmId,
            @PathVariable Long cycleId,
            @Valid @RequestBody UpdateCycleRequest request
    ) {
        CycleResponse response = operationalCycleService.updateCycle(farmId, cycleId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật chu kỳ vận hành thành công."));
    }

    @PatchMapping("/cycles/{cycleId}/status")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<CycleResponse>> updateCycleStatus(
            @PathVariable Long farmId,
            @PathVariable Long cycleId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        CycleResponse response = operationalCycleService.updateCycleStatus(farmId, cycleId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái chu kỳ thành công."));
    }

    @DeleteMapping("/cycles/{cycleId}")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<Void>> deleteCycle(
            @PathVariable Long farmId,
            @PathVariable Long cycleId
    ) {
        operationalCycleService.deleteCycle(farmId, cycleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa chu kỳ vận hành thành công."));
    }

    // Settings Endpoints
    @GetMapping("/settings")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<FarmSettingResponse>> getSettings(@PathVariable Long farmId) {
        FarmSettingResponse response = operationalCycleService.getFarmSettings(farmId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy cấu hình vận hành trang trại thành công."));
    }

    @PutMapping("/settings")
    @PreAuthorize("(hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')) and @farmSecurity.hasAccessToFarm(#farmId)")
    public ResponseEntity<ApiResponse<FarmSettingResponse>> updateSettings(
            @PathVariable Long farmId,
            @Valid @RequestBody FarmSettingRequest request
    ) {
        FarmSettingResponse response = operationalCycleService.updateFarmSettings(farmId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật cấu hình vận hành thành công."));
    }
}
