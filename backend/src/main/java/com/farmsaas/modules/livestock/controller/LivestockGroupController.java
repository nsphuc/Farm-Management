package com.farmsaas.modules.livestock.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.livestock.dto.LivestockGroupRequest;
import com.farmsaas.modules.livestock.dto.LivestockGroupResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import com.farmsaas.modules.livestock.service.LivestockGroupService;
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
@RequestMapping("/api/v1/farms/{farmId}/livestock/groups")
@RequiredArgsConstructor
public class LivestockGroupController {

    private final LivestockGroupService groupService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LivestockGroupResponse>>> searchGroups(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long breedId,
            @RequestParam(required = false) LivestockGroupStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "entryDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LivestockGroupResponse> result = groupService.searchGroups(farmId, zoneId, breedId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm đàn vật nuôi thành công."));
    }

    @GetMapping("/{groupId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LivestockGroupResponse>> getGroupById(
            @PathVariable Long farmId,
            @PathVariable Long groupId
    ) {
        LivestockGroupResponse response = groupService.getGroupById(farmId, groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết đàn vật nuôi thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockGroupResponse>> createGroup(
            @PathVariable Long farmId,
            @Valid @RequestBody LivestockGroupRequest request
    ) {
        LivestockGroupResponse response = groupService.createGroup(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Khởi tạo đàn vật nuôi mới thành công."));
    }

    @PutMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockGroupResponse>> updateGroup(
            @PathVariable Long farmId,
            @PathVariable Long groupId,
            @Valid @RequestBody LivestockGroupRequest request
    ) {
        LivestockGroupResponse response = groupService.updateGroup(farmId, groupId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật đàn vật nuôi thành công."));
    }

    @PatchMapping("/{groupId}/status")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<LivestockGroupResponse>> updateStatus(
            @PathVariable Long farmId,
            @PathVariable Long groupId,
            @RequestParam LivestockGroupStatus status
    ) {
        LivestockGroupResponse response = groupService.updateStatus(farmId, groupId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái đàn thành công."));
    }

    @PatchMapping("/{groupId}/quantity")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<LivestockGroupResponse>> adjustQuantity(
            @PathVariable Long farmId,
            @PathVariable Long groupId,
            @RequestParam Integer quantityChange,
            @RequestParam(required = false, defaultValue = "Điều chỉnh số lượng đàn") String reason
    ) {
        LivestockGroupResponse response = groupService.adjustQuantity(farmId, groupId, quantityChange, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Điều chỉnh số lượng cá thể trong đàn thành công."));
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable Long farmId,
            @PathVariable Long groupId
    ) {
        groupService.deleteGroup(farmId, groupId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa đàn vật nuôi thành công."));
    }
}
