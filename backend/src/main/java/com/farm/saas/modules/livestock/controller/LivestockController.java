package com.farm.saas.modules.livestock.controller;

import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.*;
import com.farm.saas.modules.livestock.service.LivestockService;
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

@RestController
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
@Tag(name = "Livestock", description = "Quản lý đàn nuôi, cá thể RFID, cân nặng ADG và sự kiện thú y Auto-Backflushing")
public class LivestockController {

    private final LivestockService livestockService;

    // ==========================================
    // 1. LIVESTOCK GROUPS
    // ==========================================

    @GetMapping("/livestock-groups")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách đàn nuôi", description = "Lấy danh sách các đàn nuôi có phân trang và lọc theo trạng thái")
    public ResponseEntity<Page<LivestockGroupDetailResponse>> getGroups(
            @PathVariable Long farmId,
            @RequestParam(required = false) String status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(livestockService.getGroups(farmId, status, pageable));
    }

    @GetMapping("/livestock-groups/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết đàn nuôi", description = "Lấy thông tin chi tiết đàn nuôi, hạn cách ly thuốc và chi phí tích lũy")
    public ResponseEntity<LivestockGroupDetailResponse> getGroupById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(livestockService.getGroupById(farmId, id));
    }

    @PostMapping("/livestock-groups")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo đàn nuôi mới", description = "Tạo đàn nuôi mới với số lượng ban đầu và giống")
    public ResponseEntity<LivestockGroupDetailResponse> createGroup(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateLivestockGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.createGroup(farmId, request));
    }

    @PutMapping("/livestock-groups/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật đàn nuôi", description = "Cập nhật số lượng hiện tại, chuồng nuôi hoặc trạng thái đàn")
    public ResponseEntity<LivestockGroupDetailResponse> updateGroup(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateLivestockGroupRequest request) {
        return ResponseEntity.ok(livestockService.updateGroup(farmId, id, request));
    }

    // ==========================================
    // 2. LIVESTOCK INDIVIDUALS
    // ==========================================

    @GetMapping("/livestock-individuals")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách cá thể RFID", description = "Lấy danh sách cá thể gắn thẻ RFID, lọc theo đàn hoặc sức khỏe")
    public ResponseEntity<Page<LivestockIndividualDetailResponse>> getIndividuals(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String healthStatus,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(livestockService.getIndividuals(farmId, groupId, healthStatus, pageable));
    }

    @GetMapping("/livestock-individuals/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Chi tiết cá thể RFID", description = "Lấy thông tin cá thể RFID kèm chỉ số tăng trọng ADG gần nhất")
    public ResponseEntity<LivestockIndividualDetailResponse> getIndividualById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(livestockService.getIndividualById(farmId, id));
    }

    @PostMapping("/livestock-individuals")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo cá thể RFID mới", description = "Đăng ký cá thể mới với mã định danh RFID duy nhất")
    public ResponseEntity<LivestockIndividualDetailResponse> createIndividual(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateLivestockIndividualRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.createIndividual(farmId, request));
    }

    @PutMapping("/livestock-individuals/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật cá thể RFID", description = "Cập nhật cân nặng, tình trạng sức khỏe hoặc chuồng nuôi")
    public ResponseEntity<LivestockIndividualDetailResponse> updateIndividual(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateLivestockIndividualRequest request) {
        return ResponseEntity.ok(livestockService.updateIndividual(farmId, id, request));
    }

    // ==========================================
    // 3. WEIGH-IN & ADG
    // ==========================================

    @PostMapping("/livestock-groups/{id}/weigh-in")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Ghi nhật ký cân nặng đàn nuôi", description = "Ghi nhận cân nặng theo đàn, tự động tính tốc độ tăng trọng ADG so với lần cân liền trước")
    public ResponseEntity<WeightLogDetailResponse> recordGroupWeighIn(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody WeighInRequest request) {
        if (request.getTargetType() == null) {
            request.setTargetType("GROUP");
        }
        if (request.getGroupId() == null) {
            request.setGroupId(id);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.recordWeighIn(farmId, request));
    }

    @PostMapping("/livestock/weigh-in")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Ghi nhật ký cân nặng linh hoạt", description = "Ghi nhận cân nặng cho cá thể hoặc đàn theo luật XOR và tính ADG")
    public ResponseEntity<WeightLogDetailResponse> recordWeighIn(
            @PathVariable Long farmId,
            @Valid @RequestBody WeighInRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.recordWeighIn(farmId, request));
    }

    // ==========================================
    // 4. LIVESTOCK EVENTS & AUTO-BACKFLUSHING
    // ==========================================

    @GetMapping("/livestock-events")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách sự kiện chăn nuôi", description = "Lấy lịch sử sự kiện tiêm phòng, khám chữa bệnh, biến động đàn")
    public ResponseEntity<Page<LivestockEventDetailResponse>> getEvents(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Long individualId,
            @PageableDefault(sort = "eventDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(livestockService.getEvents(farmId, groupId, individualId, pageable));
    }

    @PostMapping("/livestock-groups/{id}/events")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_VET', 'PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Ghi sự kiện chăn nuôi đàn & Auto-Backflushing",
            description = "Ghi sự kiện vắc-xin/thú y cho đàn nuôi, tự động tính ngày hết cách ly thuốc và trừ kho nguyên tử")
    public ResponseEntity<LivestockEventDetailResponse> createGroupEvent(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody CreateLivestockEventRequest request) {
        if (request.getTargetType() == null) {
            request.setTargetType("GROUP");
        }
        if (request.getLivestockGroupId() == null) {
            request.setLivestockGroupId(id);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.createEvent(farmId, request));
    }

    @PostMapping("/livestock-events")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_VET', 'PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo sự kiện chăn nuôi / thú y linh hoạt",
            description = "Tạo sự kiện chăn nuôi cho cá thể hoặc đàn, xử lý cách ly, biến động đàn và Atomic Auto-Backflushing vật tư tiêu hao")
    public ResponseEntity<LivestockEventDetailResponse> createEvent(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateLivestockEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.createEvent(farmId, request));
    }
}
