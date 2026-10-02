package com.farmsaas.modules.livestock.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.livestock.dto.LivestockIndividualRequest;
import com.farmsaas.modules.livestock.dto.LivestockIndividualResponse;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import com.farmsaas.modules.livestock.service.LivestockIndividualService;
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
@RequestMapping("/api/v1/farms/{farmId}/livestock/individuals")
@RequiredArgsConstructor
public class LivestockIndividualController {

    private final LivestockIndividualService individualService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LivestockIndividualResponse>>> searchIndividuals(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) HealthStatus healthStatus,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LivestockIndividualResponse> result = individualService.searchIndividuals(
                farmId, zoneId, groupId, healthStatus, gender, keyword, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm danh sách cá thể thành công."));
    }

    @GetMapping("/{individualId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LivestockIndividualResponse>> getIndividualById(
            @PathVariable Long farmId,
            @PathVariable Long individualId
    ) {
        LivestockIndividualResponse response = individualService.getIndividualById(farmId, individualId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin lý lịch cá thể thành công."));
    }

    @GetMapping("/rfid/{rfidTagCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LivestockIndividualResponse>> getIndividualByRfid(
            @PathVariable Long farmId,
            @PathVariable String rfidTagCode
    ) {
        LivestockIndividualResponse response = individualService.getIndividualByRfid(rfidTagCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu cá thể theo mã RFID/thẻ tai thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockIndividualResponse>> createIndividual(
            @PathVariable Long farmId,
            @Valid @RequestBody LivestockIndividualRequest request
    ) {
        LivestockIndividualResponse response = individualService.createIndividual(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký cá thể mới thành công (Đã lập chỉ mục RFID)."));
    }

    @PutMapping("/{individualId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockIndividualResponse>> updateIndividual(
            @PathVariable Long farmId,
            @PathVariable Long individualId,
            @Valid @RequestBody LivestockIndividualRequest request
    ) {
        LivestockIndividualResponse response = individualService.updateIndividual(farmId, individualId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật hồ sơ cá thể thành công."));
    }

    @PatchMapping("/{individualId}/health")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<LivestockIndividualResponse>> updateHealthStatus(
            @PathVariable Long farmId,
            @PathVariable Long individualId,
            @RequestParam HealthStatus healthStatus,
            @RequestParam(required = false) String notes
    ) {
        LivestockIndividualResponse response = individualService.updateHealthStatus(farmId, individualId, healthStatus, notes);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái sức khỏe cá thể thành công."));
    }

    @DeleteMapping("/{individualId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteIndividual(
            @PathVariable Long farmId,
            @PathVariable Long individualId
    ) {
        individualService.deleteIndividual(farmId, individualId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa cá thể vật nuôi thành công."));
    }
}
