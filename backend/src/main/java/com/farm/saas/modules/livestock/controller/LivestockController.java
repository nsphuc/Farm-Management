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
    @PreAuthorize("(hasAnyAuthority('PERM_LIVESTOCK_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách đàn nuôi", description = "Lấy danh sách các đàn nuôi có phân trang và lọc theo trạng thái")
    public ResponseEntity<Page<LivestockGroupDetailResponse>> getGroups(
            @PathVariable Long farmId,
            @RequestParam(required = false) String status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(livestockService.getGroups(farmId, status, pageable));
    }

    @GetMapping("/livestock-groups/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_LIVESTOCK_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
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

    @PostMapping("/livestock-groups/{id}/close")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Đóng / Kết thúc đàn nuôi (SOLD)", description = "Kết thúc đàn nuôi khi xuất chuồng và hủy các nhiệm vụ thường nhật")
    public ResponseEntity<LivestockGroupDetailResponse> closeGroup(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(livestockService.closeGroup(farmId, id));
    }

    @DeleteMapping("/livestock-groups/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Xóa đàn nuôi", description = "Xóa hoặc xuất bán kết thúc đàn nuôi")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        livestockService.deleteGroup(farmId, id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 2. LIVESTOCK INDIVIDUALS
    // ==========================================

    @GetMapping("/livestock-individuals")
    @PreAuthorize("(hasAnyAuthority('PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Danh sách cá thể RFID", description = "Lấy danh sách cá thể gắn thẻ RFID, lọc theo đàn hoặc sức khỏe")
    public ResponseEntity<Page<LivestockIndividualDetailResponse>> getIndividuals(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String healthStatus,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(livestockService.getIndividuals(farmId, groupId, healthStatus, pageable));
    }

    @GetMapping("/livestock-individuals/{id}")
    @PreAuthorize("(hasAuthority('PERM_LIVESTOCK_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
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
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật cá thể RFID", description = "Cập nhật cân nặng, tình trạng sức khỏe hoặc chuồng nuôi")
    public ResponseEntity<LivestockIndividualDetailResponse> updateIndividual(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateLivestockIndividualRequest request) {
        return ResponseEntity.ok(livestockService.updateIndividual(farmId, id, request));
    }

    @DeleteMapping("/livestock-individuals/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Xóa cá thể RFID", description = "Xóa hoặc đào thải cá thể")
    public ResponseEntity<Void> deleteIndividual(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        livestockService.deleteIndividual(farmId, id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 3. WEIGH-IN & ADG
    // ==========================================

    @PostMapping("/livestock-groups/{id}/weigh-in")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
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

    @GetMapping("/livestock-groups/{id}/weight-logs")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Lịch sử cân nặng đàn nuôi", description = "Lấy lịch sử cân nặng và tính ADG của đàn nuôi")
    public ResponseEntity<java.util.List<WeightLogDetailResponse>> getGroupWeightLogs(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(livestockService.getGroupWeightLogs(farmId, id));
    }

    @PostMapping("/livestock/weigh-in")
    @PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
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
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VET') and @farmSecurity.canAccessFarm(#farmId)")
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
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VET') and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Tạo sự kiện chăn nuôi / thú y linh hoạt",
            description = "Tạo sự kiện chăn nuôi cho cá thể hoặc đàn, xử lý cách ly, biến động đàn và Atomic Auto-Backflushing vật tư tiêu hao")
    public ResponseEntity<LivestockEventDetailResponse> createEvent(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateLivestockEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livestockService.createEvent(farmId, request));
    }
}
