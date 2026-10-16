package com.farm.saas.modules.organization.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.organization.dto.request.PartnerCreateRequest;
import com.farm.saas.modules.organization.dto.request.PartnerUpdateRequest;
import com.farm.saas.modules.organization.dto.response.PartnerResponse;
import com.farm.saas.modules.organization.entity.PartnerStatus;
import com.farm.saas.modules.organization.entity.PartnerType;
import com.farm.saas.modules.organization.service.PartnerService;
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
 * Controller quản lý Đối tác (Partners: Nhà cung cấp, Khách hàng, Logistics, Đại lý).
 * Base URL: /api/v1/partners
 * Thuộc Nhóm 1 - Quản lý tổ chức & trang trại (1.6 Quản lý đối tác).
 */
@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
@Tag(name = "Partner Management", description = "APIs CRUD quản lý Đối tác, Nhà cung cấp, Khách hàng theo Tenant")
public class PartnerController {

    private final PartnerService partnerService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW')")
    @Operation(summary = "Lấy danh sách đối tác có phân trang (Yêu cầu PERM_INVENTORY_VIEW hoặc PERM_FINANCE_REPORT)")
    public ResponseEntity<ApiResponse<Page<PartnerResponse>>> getPartners(
            @RequestParam(value = "partnerType", required = false) PartnerType partnerType,
            @RequestParam(value = "status", required = false) PartnerStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PartnerResponse> partners = partnerService.getPartners(partnerType, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đối tác thành công", partners));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW')")
    @Operation(summary = "Lấy toàn bộ đối tác của Tenant (dành cho dropdown/select)")
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> getAllPartners(
            @RequestParam(value = "partnerType", required = false) PartnerType partnerType) {
        List<PartnerResponse> partners = partnerService.getAllPartners(partnerType);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đối tác thành công", partners));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW')")
    @Operation(summary = "Xem thông tin chi tiết đối tác theo ID")
    public ResponseEntity<ApiResponse<PartnerResponse>> getPartnerById(@PathVariable("id") Long id) {
        PartnerResponse partner = partnerService.getPartnerById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đối tác thành công", partner));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Tạo mới đối tác (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<PartnerResponse>> createPartner(@Valid @RequestBody PartnerCreateRequest request) {
        PartnerResponse created = partnerService.createPartner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mới đối tác thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Cập nhật thông tin đối tác (Giới hạn cho cấp quản lý)")
    public ResponseEntity<ApiResponse<PartnerResponse>> updatePartner(
            @PathVariable("id") Long id,
            @Valid @RequestBody PartnerUpdateRequest request) {
        PartnerResponse updated = partnerService.updatePartner(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin đối tác thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Ngừng hợp tác / Vô hiệu hóa đối tác (Soft-delete: status=INACTIVE)")
    public ResponseEntity<ApiResponse<Void>> deletePartner(@PathVariable("id") Long id) {
        partnerService.deactivatePartner(id);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa đối tác thành công", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN') or hasAuthority('PERM_FARM_UPDATE')")
    @Operation(summary = "Ngừng hợp tác với đối tác (Theo quy chuẩn REST action)")
    public ResponseEntity<ApiResponse<Void>> deactivatePartner(@PathVariable("id") Long id) {
        partnerService.deactivatePartner(id);
        return ResponseEntity.ok(ApiResponse.success("Ngừng hợp tác với đối tác thành công", null));
    }
}
