package com.farmsaas.modules.partner.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.partner.dto.PartnerRequest;
import com.farmsaas.modules.partner.dto.PartnerResponse;
import com.farmsaas.modules.partner.service.PartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PartnerResponse>>> getPartners(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String partnerType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String creditRating,
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<PartnerResponse> response = partnerService.getPartners(
                keyword,
                partnerType,
                status,
                creditRating,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách đối tác thành công."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> getPartnerById(@PathVariable Long id) {
        PartnerResponse response = partnerService.getPartnerById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin đối tác thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<PartnerResponse>> createPartner(
            @Valid @RequestBody PartnerRequest request
    ) {
        PartnerResponse response = partnerService.createPartner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thêm mới đối tác thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<PartnerResponse>> updatePartner(
            @PathVariable Long id,
            @Valid @RequestBody PartnerRequest request
    ) {
        PartnerResponse response = partnerService.updatePartner(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật đối tác thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deletePartner(@PathVariable Long id) {
        partnerService.deletePartner(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa đối tác thành công."));
    }
}
