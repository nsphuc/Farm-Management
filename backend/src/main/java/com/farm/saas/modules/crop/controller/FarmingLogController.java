package com.farm.saas.modules.crop.controller;

import com.farm.saas.modules.crop.dto.request.CreateFarmingLogRequest;
import com.farm.saas.modules.crop.dto.response.FarmingLogDetailResponse;
import com.farm.saas.modules.crop.service.FarmingLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/farming-logs")
@RequiredArgsConstructor
@Tag(name = "Farming Logs", description = "Quản lý nhật ký canh tác và luồng Atomic Auto-Backflushing")
public class FarmingLogController {

    private final FarmingLogService farmingLogService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_CROP_VIEW', 'PERM_CROP_LOG') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách nhật ký canh tác", description = "Truy vấn danh sách nhật ký có phân trang và lọc theo mùa vụ hoặc khoảng ngày")
    public ResponseEntity<Page<FarmingLogDetailResponse>> getFarmingLogs(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(sort = "logDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(farmingLogService.getFarmingLogs(farmId, seasonId, fromDate, toDate, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_CROP_VIEW', 'PERM_CROP_LOG') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết nhật ký canh tác", description = "Lấy chi tiết nhật ký kèm danh sách vật tư đã trích xuất")
    public ResponseEntity<FarmingLogDetailResponse> getFarmingLogById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(farmingLogService.getFarmingLogById(farmId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CROP_LOG') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Ghi nhật ký canh tác & Atomic Auto-Backflushing",
            description = "Ghi nhận hoạt động canh tác, tự động kiểm tra tồn kho, khóa bi quan, trừ kho xuất vật tư và hạch toán chi phí")
    public ResponseEntity<FarmingLogDetailResponse> createFarmingLog(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateFarmingLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmingLogService.createFarmingLog(farmId, request));
    }
}
