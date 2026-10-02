package com.farmsaas.modules.farm.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.FarmSummaryResponse;
import com.farmsaas.modules.farm.dto.UpdateFarmRequest;
import com.farmsaas.modules.farm.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FarmResponse>>> getFarms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String farmType,
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<FarmResponse> response = farmService.getFarms(keyword, status, farmType, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách trang trại thành công."));
    }

    @GetMapping("/my-accessible")
    public ResponseEntity<ApiResponse<List<FarmSummaryResponse>>> getMyAccessibleFarms() {
        List<FarmSummaryResponse> list = farmService.getMyAccessibleFarms();
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách trang trại được truy cập thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@farmSecurity.hasAccessToFarm(#id)")
    public ResponseEntity<ApiResponse<FarmResponse>> getFarmById(@PathVariable Long id) {
        FarmResponse response = farmService.getFarmById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin trang trại thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<FarmResponse>> createFarm(@Valid @RequestBody CreateFarmRequest request) {
        FarmResponse response = farmService.createFarm(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo trang trại mới thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or (hasRole('ROLE_FARM_OWNER') and @farmSecurity.hasAccessToFarm(#id))")
    public ResponseEntity<ApiResponse<FarmResponse>> updateFarm(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFarmRequest request
    ) {
        FarmResponse response = farmService.updateFarm(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trang trại thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFarm(@PathVariable Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa trang trại thành công."));
    }
}
