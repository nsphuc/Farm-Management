package com.farm.saas.modules.inventory.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.modules.inventory.dto.request.InventoryIssueCreateRequest;
import com.farm.saas.modules.inventory.dto.response.InventoryIssueResponse;
import com.farm.saas.modules.inventory.service.InventoryIssueService;
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

import java.util.Map;

/**
 * Controller xử lý các yêu cầu Giao dịch Xuất kho (Nghiệp vụ: 3.4. Xuất kho - Inventory Issues).
 * Base URL: /api/v1/inventory/issues
 */
@RestController
@RequestMapping("/api/v1/inventory/issues")
@RequiredArgsConstructor
@Tag(name = "Inventory Issues", description = "APIs quản lý chứng từ Xuất kho và trừ thẻ kho (3.4 Xuất kho)")
public class InventoryIssueController {

    private final InventoryIssueService issueService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_ISSUE')")
    @Operation(summary = "Tạo mới Phiếu Xuất kho (Yêu cầu PERM_INVENTORY_MANAGE hoặc PERM_INVENTORY_ISSUE)")
    public ResponseEntity<ApiResponse<InventoryIssueResponse>> createIssue(
            @Valid @RequestBody InventoryIssueCreateRequest request) {
        InventoryIssueResponse response = issueService.createIssue(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu xuất kho thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Lấy danh sách phiếu xuất kho có phân trang (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<Page<InventoryIssueResponse>>> getIssues(
            @RequestParam(value = "farmId", required = false) Long farmId,
            @RequestParam(value = "warehouseId", required = false) Long warehouseId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InventoryIssueResponse> page = issueService.getIssues(farmId, warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu xuất kho thành công", page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    @Operation(summary = "Xem chi tiết Phiếu Xuất kho theo ID (Yêu cầu PERM_INVENTORY_VIEW)")
    public ResponseEntity<ApiResponse<InventoryIssueResponse>> getIssueById(@PathVariable("id") Long id) {
        InventoryIssueResponse response = issueService.getIssueById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phiếu xuất kho thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_ISSUE')")
    @Operation(summary = "Hủy Phiếu Xuất kho (Hoàn cộng lại tồn kho an toàn)")
    public ResponseEntity<ApiResponse<Void>> cancelIssue(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Hủy theo yêu cầu của người dùng";
        issueService.cancelIssue(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu xuất kho thành công", null));
    }
}
