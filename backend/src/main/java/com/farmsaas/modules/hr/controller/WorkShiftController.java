package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.hr.dto.WorkShiftRequest;
import com.farmsaas.modules.hr.dto.WorkShiftResponse;
import com.farmsaas.modules.hr.service.WorkShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/shifts", "/api/v1/farms/{farmId}/work-shifts"})
@RequiredArgsConstructor
public class WorkShiftController {

    private final WorkShiftService workShiftService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> getAllShifts(
            @PathVariable Long farmId,
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly
    ) {
        List<WorkShiftResponse> list = workShiftService.getAllShifts(farmId, activeOnly);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách ca làm việc thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> getShiftById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        WorkShiftResponse response = workShiftService.getShiftById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết ca làm việc thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> createShift(
            @PathVariable Long farmId,
            @Valid @RequestBody WorkShiftRequest request
    ) {
        WorkShiftResponse response = workShiftService.createShift(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Khởi tạo ca làm việc thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> updateShift(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody WorkShiftRequest request
    ) {
        WorkShiftResponse response = workShiftService.updateShift(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật ca làm việc thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteShift(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        workShiftService.deleteShift(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa ca làm việc thành công."));
    }
}
