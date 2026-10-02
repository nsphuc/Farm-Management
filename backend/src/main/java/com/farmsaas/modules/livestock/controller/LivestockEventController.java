package com.farmsaas.modules.livestock.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.livestock.dto.LivestockEventRequest;
import com.farmsaas.modules.livestock.dto.LivestockEventResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import com.farmsaas.modules.livestock.service.LivestockEventService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/livestock/events")
@RequiredArgsConstructor
public class LivestockEventController {

    private final LivestockEventService eventService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LivestockEventResponse>>> searchEvents(
            @PathVariable Long farmId,
            @RequestParam(required = false) TargetType targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) LivestockEventType eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "eventDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LivestockEventResponse> result = eventService.searchEvents(farmId, targetType, targetId, eventType, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm nhật ký sự kiện chăn nuôi thành công."));
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LivestockEventResponse>> getEventById(
            @PathVariable Long farmId,
            @PathVariable Long eventId
    ) {
        LivestockEventResponse response = eventService.getEventById(farmId, eventId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết sự kiện chăn nuôi thành công."));
    }

    @GetMapping("/target/{targetType}/{targetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LivestockEventResponse>>> getEventsByTarget(
            @PathVariable Long farmId,
            @PathVariable TargetType targetType,
            @PathVariable Long targetId
    ) {
        List<LivestockEventResponse> response = eventService.getEventsByTarget(farmId, targetType, targetId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử sự kiện của đối tượng thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FIELD_STAFF')")
    public ResponseEntity<ApiResponse<LivestockEventResponse>> recordEvent(
            @PathVariable Long farmId,
            @Valid @RequestBody LivestockEventRequest request
    ) {
        LivestockEventResponse response = eventService.recordEvent(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhận sự kiện chăn nuôi thành công (Đã cập nhật trừ kho ngầm nếu có tiêu hao thuốc/thức ăn)."));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable Long farmId,
            @PathVariable Long eventId
    ) {
        eventService.deleteEvent(farmId, eventId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa sự kiện chăn nuôi thành công."));
    }
}
