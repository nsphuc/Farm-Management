package com.farm.saas.modules.livestock.controller;

import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.ProgramDetailResponse;
import com.farm.saas.modules.livestock.service.LivestockSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/livestock-settings")
@RequiredArgsConstructor
@Tag(name = "Livestock Settings", description = "Quản lý thiết lập chăn nuôi: quy trình, định mức cám, lịch vắc-xin, chỉ số môi trường và KPI chuẩn")
public class LivestockSettingsController {

    private final LivestockSettingsService livestockSettingsService;

    // ==========================================
    // 1. CHƯƠNG TRÌNH NUÔI & ĐỊNH MỨC CÁM / VẮC-XIN
    // ==========================================

    @GetMapping("/programs")
    @PreAuthorize("hasAnyAuthority('livestock_settings.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF')")
    @Operation(summary = "Danh sách chương trình nuôi", description = "Lấy danh sách các quy trình nuôi kèm đầy đủ định mức cám và lịch vắc-xin")
    public ResponseEntity<List<ProgramDetailResponse>> getPrograms(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(livestockSettingsService.getPrograms(farmId));
    }

    @GetMapping("/programs/{id}")
    @PreAuthorize("hasAnyAuthority('livestock_settings.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF')")
    @Operation(summary = "Chi tiết chương trình nuôi")
    public ResponseEntity<ProgramDetailResponse> getProgramById(@PathVariable Long id) {
        return ResponseEntity.ok(livestockSettingsService.getProgramById(id));
    }

    @PostMapping("/programs")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Tạo chương trình nuôi mới")
    public ResponseEntity<ProgramDetailResponse> createProgram(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockSettingsService.createProgram(farmId, request));
    }

    @PutMapping({"/programs/{id}", "/breeds/{id}"})
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Cập nhật chương trình nuôi")
    public ResponseEntity<ProgramDetailResponse> updateProgram(
            @PathVariable Long id,
            @Valid @RequestBody CreateProgramRequest request) {
        return ResponseEntity.ok(livestockSettingsService.updateProgram(id, request));
    }

    @DeleteMapping({"/programs/{id}", "/breeds/{id}"})
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa chương trình nuôi")
    public ResponseEntity<Void> deleteProgram(@PathVariable Long id) {
        livestockSettingsService.deleteProgram(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/programs/{id}/quotas")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Thêm mốc định mức cám")
    public ResponseEntity<ProgramDetailResponse.FeedStandardItem> addFeedStandard(
            @PathVariable Long id,
            @Valid @RequestBody FeedStandardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockSettingsService.addFeedStandard(id, request));
    }

    @PutMapping("/programs/{id}/quotas/{quotaId}")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Sửa mốc định mức cám")
    public ResponseEntity<ProgramDetailResponse.FeedStandardItem> updateFeedStandard(
            @PathVariable Long id,
            @PathVariable Long quotaId,
            @Valid @RequestBody FeedStandardRequest request) {
        return ResponseEntity.ok(livestockSettingsService.updateFeedStandard(id, quotaId, request));
    }

    @DeleteMapping("/programs/{id}/quotas/{quotaId}")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa mốc định mức cám")
    public ResponseEntity<Void> deleteQuota(
            @PathVariable Long id,
            @PathVariable Long quotaId) {
        livestockSettingsService.deleteQuota(quotaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/programs/{id}/quotas/batch-range")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Tạo nhanh định mức cám theo khoảng ngày")
    public ResponseEntity<List<ProgramDetailResponse.FeedStandardItem>> batchRangeFeed(
            @PathVariable Long id,
            @Valid @RequestBody BatchRangeFeedRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockSettingsService.batchRangeFeed(id, request));
    }

    @PostMapping("/programs/{id}/vaccines")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Thêm lịch vắc-xin / thuốc")
    public ResponseEntity<ProgramDetailResponse.VaccineTimelineItem> addVaccine(
            @PathVariable Long id,
            @Valid @RequestBody VaccineTimelineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockSettingsService.addVaccine(id, request));
    }

    @PutMapping("/programs/{id}/vaccines/{quotaId}")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Sửa lịch vắc-xin / thuốc")
    public ResponseEntity<ProgramDetailResponse.VaccineTimelineItem> updateVaccine(
            @PathVariable Long id,
            @PathVariable Long quotaId,
            @Valid @RequestBody VaccineTimelineRequest request) {
        return ResponseEntity.ok(livestockSettingsService.updateVaccine(id, quotaId, request));
    }

    @DeleteMapping("/programs/{id}/vaccines/{quotaId}")
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Xóa mốc vắc-xin")
    public ResponseEntity<Void> deleteVaccine(
            @PathVariable Long id,
            @PathVariable Long quotaId) {
        livestockSettingsService.deleteQuota(quotaId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 2. CHỈ SỐ MÔI TRƯỜNG & KPI CHUẨN
    // ==========================================

    @GetMapping(value = "/env-metrics", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyAuthority('livestock_settings.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF')")
    @Operation(summary = "Lấy cấu hình chỉ số môi trường")
    public ResponseEntity<String> getEnvMetrics(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(livestockSettingsService.getEnvMetrics(farmId));
    }

    @PutMapping(value = "/env-metrics", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE})
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Lưu cấu hình chỉ số môi trường")
    public ResponseEntity<Map<String, String>> updateEnvMetrics(
            @RequestParam(required = false) Long farmId,
            @RequestBody String envMetricsJson) {
        livestockSettingsService.updateEnvMetrics(farmId, envMetricsJson);
        return ResponseEntity.ok(Map.of("message", "Cập nhật cấu hình môi trường thành công"));
    }

    @GetMapping(value = "/kpis", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyAuthority('livestock_settings.view', 'PERM_LIVESTOCK_VIEW', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_TECHNICAL_STAFF')")
    @Operation(summary = "Lấy cấu hình mục tiêu KPI và lý do loại thải")
    public ResponseEntity<String> getKpis(@RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(livestockSettingsService.getKpis(farmId));
    }

    @PutMapping(value = "/kpis", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE})
    @PreAuthorize("hasAnyAuthority('livestock_settings.manage', 'PERM_LIVESTOCK_MANAGE', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "Lưu cấu hình KPI và lý do loại thải")
    public ResponseEntity<Map<String, String>> updateKpis(
            @RequestParam(required = false) Long farmId,
            @RequestBody String kpisJson) {
        livestockSettingsService.updateKpis(farmId, kpisJson);
        return ResponseEntity.ok(Map.of("message", "Cập nhật cấu hình KPI thành công"));
    }
}
