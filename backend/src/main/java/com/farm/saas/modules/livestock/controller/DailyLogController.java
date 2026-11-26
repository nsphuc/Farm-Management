package com.farm.saas.modules.livestock.controller;

import com.farm.saas.modules.livestock.dto.request.CreateDailyLogRequest;
import com.farm.saas.modules.livestock.dto.response.DailyLogRemindersResponse;
import com.farm.saas.modules.livestock.dto.response.DailyLogResponse;
import com.farm.saas.modules.livestock.service.DailyLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/v1/daily-logs")
@RequiredArgsConstructor
@Tag(name = "Daily Logs", description = "Quản lý ghi nhật ký hằng ngày: cho ăn, thuốc, báo chết và cân mẫu môi trường")
public class DailyLogController {

    private final DailyLogService dailyLogService;

    @GetMapping("/reminders")
    @PreAuthorize("hasAnyAuthority('daily_logs.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_BARN_WORKER', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Lấy nhắc việc và định mức thức ăn / vắc-xin hôm nay")
    public ResponseEntity<DailyLogRemindersResponse> getReminders(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long barnId,
            @RequestParam(required = false) Long batchId) {
        return ResponseEntity.ok(dailyLogService.getReminders(farmId, barnId, batchId));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('daily_logs.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_BARN_WORKER', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Danh sách phiếu nhật ký trong ngày")
    public ResponseEntity<List<DailyLogResponse>> getDailyLogs(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long barnId,
            @RequestParam(required = false) Long batchId) {
        return ResponseEntity.ok(dailyLogService.getDailyLogs(farmId, date, barnId, batchId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('daily_logs.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_BARN_WORKER', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Ghi phiếu nhật ký mới (Trừ kho FEFO, cập nhật sĩ số & ADG)")
    public ResponseEntity<DailyLogResponse> createDailyLog(@Valid @RequestBody CreateDailyLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dailyLogService.createDailyLog(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("!hasAnyRole('ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF') and hasAnyAuthority('daily_logs.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Sửa phiếu nhật ký (Quản lý/Chủ trại/Kỹ thuật)")
    public ResponseEntity<DailyLogResponse> updateDailyLog(
            @PathVariable Long id,
            @Valid @RequestBody CreateDailyLogRequest request) {
        return ResponseEntity.ok(dailyLogService.updateDailyLog(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("!hasAnyRole('ROLE_BARN_WORKER', 'ROLE_FIELD_STAFF') and hasAnyAuthority('daily_logs.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa phiếu nhật ký và hoàn trả tồn kho (Quản lý/Chủ trại)")
    public ResponseEntity<Void> deleteDailyLog(@PathVariable Long id) {
        dailyLogService.deleteDailyLog(id);
        return ResponseEntity.noContent().build();
    }
}
