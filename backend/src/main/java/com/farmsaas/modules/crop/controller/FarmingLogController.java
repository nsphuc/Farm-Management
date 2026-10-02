package com.farmsaas.modules.crop.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.crop.dto.FarmingLogRequest;
import com.farmsaas.modules.crop.dto.FarmingLogResponse;
import com.farmsaas.modules.crop.service.FarmingLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/seasons/{seasonId}/logs")
@RequiredArgsConstructor
public class FarmingLogController {

    private final FarmingLogService farmingLogService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<FarmingLogResponse>>> getLogsBySeason(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "logDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FarmingLogResponse> result = farmingLogService.getLogsBySeason(farmId, seasonId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy danh sách nhật ký canh tác thành công."));
    }

    @GetMapping("/{logId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FarmingLogResponse>> getLogById(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @PathVariable Long logId
    ) {
        FarmingLogResponse response = farmingLogService.getLogById(farmId, seasonId, logId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết nhật ký canh tác thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<FarmingLogResponse>> createLog(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @Valid @RequestBody FarmingLogRequest request
    ) {
        FarmingLogResponse response = farmingLogService.createLog(farmId, seasonId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhật ký canh tác thành công (đã tự động cập nhật tồn kho nếu có vật tư tiêu hao)."));
    }

    @DeleteMapping("/{logId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteLog(
            @PathVariable Long farmId,
            @PathVariable Long seasonId,
            @PathVariable Long logId
    ) {
        farmingLogService.deleteLog(farmId, seasonId, logId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa nhật ký canh tác thành công."));
    }
}
