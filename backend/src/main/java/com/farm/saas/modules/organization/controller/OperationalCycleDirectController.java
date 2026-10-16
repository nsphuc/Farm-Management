package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.OperationalCycleCreateRequest;
import com.farm.saas.modules.organization.dto.request.OperationalCycleUpdateRequest;
import com.farm.saas.modules.organization.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import com.farm.saas.modules.organization.service.OperationalCycleService;
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

/**
 * Controller truy xuất trực tiếp Chu kỳ vận hành theo Tenant.
 * Base URLs: /api/v1/cycles và /api/v1/operational-cycles
 */
@RestController
@RequestMapping({"/api/v1/cycles", "/api/v1/operational-cycles"})
@RequiredArgsConstructor
@Tag(name = "Operational Cycle Management (Direct)", description = "APIs tra cứu & thao tác Chu kỳ canh tác trực tiếp theo Tenant")
public class OperationalCycleDirectController {

    private final OperationalCycleService cycleService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_FARM_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Lấy danh sách chu kỳ vận hành trực tiếp theo Tenant hoặc lọc theo Farm")
    public ResponseEntity<ApiResponse<Page<OperationalCycleResponse>>> getCyclesDirect(
            @RequestParam(value = "farmId", required = false) Long farmId,
            @RequestParam(value = "status", required = false) OperationalCycleStatus status,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OperationalCycleResponse> page = cycleService.getCyclesByTenant(farmId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chu kỳ vận hành thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_FARM_VIEW', 'PERM_FINANCE_REPORT')")
    @Operation(summary = "Xem chi tiết chu kỳ vận hành trực tiếp theo ID")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> getCycleByIdDirect(@PathVariable("id") Long id) {
        OperationalCycleResponse cycle = cycleService.getCycleByIdDirect(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chu kỳ vận hành thành công", cycle));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Tạo mới chu kỳ vận hành trực tiếp (yêu cầu farmId trong body)")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> createCycleDirect(
            @Valid @RequestBody OperationalCycleCreateRequest request) {
        if (request.getStartDate() != null && request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }
        OperationalCycleResponse created = cycleService.createCycleDirect(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới chu kỳ vận hành thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Cập nhật chu kỳ vận hành trực tiếp theo ID")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> updateCycleDirect(
            @PathVariable("id") Long id,
            @Valid @RequestBody OperationalCycleUpdateRequest request) {
        if (request.getStartDate() != null && request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }
        OperationalCycleResponse updated = cycleService.updateCycleDirect(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chu kỳ vận hành thành công", updated));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Đóng chu kỳ vận hành trực tiếp theo ID")
    public ResponseEntity<ApiResponse<OperationalCycleResponse>> closeCycleDirect(@PathVariable("id") Long id) {
        OperationalCycleResponse closed = cycleService.closeCycleDirect(id);
        return ResponseEntity.ok(ApiResponse.success("Đóng chu kỳ vận hành thành công", closed));
    }
}
