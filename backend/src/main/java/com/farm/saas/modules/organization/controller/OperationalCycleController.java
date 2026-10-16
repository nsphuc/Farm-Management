package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.OperationalCycleCreateRequest;
import com.farm.saas.modules.organization.dto.request.OperationalCycleUpdateRequest;
import com.farm.saas.modules.organization.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import com.farm.saas.modules.organization.service.OperationalCycleService;
import com.farm.saas.security.scope.TheFarmBarrierGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý Chu kỳ vận hành & Năm tài chính (Operational Cycles).
 * Đường dẫn chuẩn theo thiết kế: /api/v1/farms/{farmId}/cycles
 * Hỗ trợ đồng thời bí danh: /api/v1/farms/{farmId}/operational-cycles
 * Thuộc Nhóm 1 - Quản lý tổ chức & trang trại (1.5 Cấu hình & Chu kỳ vận hành).
 */
@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
@Tag(name = "Operational Cycle Management", description = "APIs quản lý Chu kỳ canh tác & Năm tài chính theo Trang trại")
public class OperationalCycleController {

    private final OperationalCycleService cycleService;

    @GetMapping({"/{farmId}/cycles", "/{farmId}/operational-cycles"})
    @PreAuthorize("hasAnyAuthority('PERM_FARM_VIEW', 'PERM_FINANCE_REPORT')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy danh sách chu kỳ vận hành của trang trại có phân trang")
    public ResponseEntity<ApiResponse<Page<OperationalCycleResponse>>> getCyclesByFarm(
            @PathVariable("farmId") Long farmId,
            @RequestParam(value = "status", required = false) OperationalCycleStatus status,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OperationalCycleResponse> page = cycleService.getCyclesByFarm(farmId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chu kỳ vận hành thành công", page));
    }

    @GetMapping({"/{farmId}/cycles/all", "/{farmId}/operational-cycles/all"})
    @PreAuthorize("hasAnyAuthority('PERM_FARM_VIEW', 'PERM_FINANCE_REPORT')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Lấy toàn bộ chu kỳ vận hành của trang trại (Dropdown)")
    public ResponseEntity<ApiResponse<List<OperationalCycleResponse>>> getAllCyclesByFarm(@PathVariable("farmId") Long farmId) {
        List<OperationalCycleResponse> list = cycleService.getAllCyclesByFarm(farmId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chu kỳ vận hành thành công", list));
    }

    @GetMapping({"/{farmId}/cycles/{id}", "/{farmId}/operational-cycles/{id}"})
    @PreAuthorize("hasAnyAuthority('PERM_FARM_VIEW', 'PERM_FINANCE_REPORT')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Xem chi tiết chu kỳ vận hành theo ID và FarmId")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> getCycleByIdAndFarm(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        OperationalCycleResponse cycle = cycleService.getCycleById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chu kỳ vận hành thành công", cycle));
    }

    @PostMapping({"/{farmId}/cycles", "/{farmId}/operational-cycles"})
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Tạo mới chu kỳ vận hành cho trang trại (Yêu cầu quản lý Farm)")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> createCycleByFarm(
            @PathVariable("farmId") Long farmId,
            @Valid @RequestBody OperationalCycleCreateRequest request) {
        // Kiểm tra hợp lệ ngày tháng: ngày kết thúc không được nhỏ hơn ngày bắt đầu
        if (request.getStartDate() != null && request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }
        OperationalCycleResponse created = cycleService.createCycle(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới chu kỳ vận hành thành công", created));
    }

    @PutMapping({"/{farmId}/cycles/{id}", "/{farmId}/operational-cycles/{id}"})
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Cập nhật thông tin chu kỳ vận hành (Không áp dụng cho chu kỳ đã đóng)")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> updateCycleByFarm(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id,
            @Valid @RequestBody OperationalCycleUpdateRequest request) {
        // Kiểm tra hợp lệ ngày tháng: ngày kết thúc không được nhỏ hơn ngày bắt đầu
        if (request.getStartDate() != null && request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }
        OperationalCycleResponse updated = cycleService.updateCycle(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chu kỳ vận hành thành công", updated));
    }

    @PostMapping({"/{farmId}/cycles/{id}/close", "/{farmId}/operational-cycles/{id}/close"})
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @TheFarmBarrierGuard(farmParam = "farmId", requireFarm = true)
    @Operation(summary = "Đóng chu kỳ vận hành (Khóa kỳ / Chốt số liệu)")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> closeCycleByFarm(
            @PathVariable("farmId") Long farmId,
            @PathVariable("id") Long id) {
        OperationalCycleResponse closed = cycleService.closeCycle(farmId, id);
        return ResponseEntity.ok(ApiResponse.success("Đóng chu kỳ vận hành thành công", closed));
    }
}
