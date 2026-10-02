package com.farmsaas.modules.traceability.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.traceability.dto.*;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.service.ProductBatchService;
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
@RequestMapping("/api/v1/farms/{farmId}/product-batches")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService productBatchService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<ProductBatchResponse>>> searchBatches(
            @PathVariable Long farmId,
            @RequestParam(required = false) ProductBatchStatus status,
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) Long livestockGroupId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductBatchResponse> result = productBatchService.searchBatches(
                farmId, status, seasonId, livestockGroupId, keyword, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm danh mục lô thành phẩm thành công."));
    }

    @GetMapping("/{batchId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> getBatchById(
            @PathVariable Long farmId,
            @PathVariable Long batchId
    ) {
        ProductBatchResponse response = productBatchService.getBatchById(farmId, batchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin chi tiết lô thành phẩm thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> createHarvestBatch(
            @PathVariable Long farmId,
            @Valid @RequestBody HarvestBatchRequest request
    ) {
        ProductBatchResponse response = productBatchService.createHarvestBatch(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Khởi tạo lô thành phẩm thành công (Đang chờ kiểm định phê duyệt - PENDING_APPROVAL)."));
    }

    @PutMapping("/{batchId}/approve")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> approveBatch(
            @PathVariable Long farmId,
            @PathVariable Long batchId
    ) {
        ProductBatchResponse response = productBatchService.approveBatch(farmId, batchId);
        return ResponseEntity.ok(ApiResponse.success(response, "Phê duyệt kiểm định an toàn thành công (Đã sinh mã UUID và mã QR ZXing - READY_TO_PRINT)."));
    }

    @PutMapping("/{batchId}/reject")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> rejectBatch(
            @PathVariable Long farmId,
            @PathVariable Long batchId,
            @Valid @RequestBody RejectBatchRequest request
    ) {
        ProductBatchResponse response = productBatchService.rejectBatch(farmId, batchId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã từ chối kiểm định lô thành phẩm (Khóa vĩnh viễn quyền in tem và sinh QR)."));
    }

    @PutMapping("/{batchId}/recall")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> recallBatch(
            @PathVariable Long farmId,
            @PathVariable Long batchId,
            @Valid @RequestBody RecallBatchRequest request
    ) {
        ProductBatchResponse response = productBatchService.recallBatch(farmId, batchId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã kích hoạt quy trình thu hồi khẩn cấp lô hàng (RECALLED)."));
    }

    @PostMapping("/{batchId}/print-log")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_WAREHOUSE_STAFF', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LabelPrintLogResponse>> recordPrintLog(
            @PathVariable Long farmId,
            @PathVariable Long batchId,
            @Valid @RequestBody PrintLabelRequest request
    ) {
        LabelPrintLogResponse response = productBatchService.recordPrintLog(farmId, batchId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ghi nhận lịch sử in tem nhiệt thành công."));
    }

    @GetMapping("/{batchId}/print-logs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<LabelPrintLogResponse>>> getPrintLogs(
            @PathVariable Long farmId,
            @PathVariable Long batchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LabelPrintLogResponse> result = productBatchService.getPrintLogs(farmId, batchId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Lấy lịch sử in tem của lô thành công."));
    }
}
