package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.RecallProductBatchRequest;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import com.farm.saas.modules.quality.service.ProductBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller quản lý lô sản phẩm thành phẩm ở phạm vi toàn Doanh nghiệp / Khách thuê (Tenant-level).
 * Cho phép Giám đốc doanh nghiệp hoặc cấp quản trị truy vấn toàn bộ các lô sản phẩm xuyên suốt các nông trường,
 * xem thông tin chi tiết và ra lệnh thu hồi lô sản phẩm trên phạm vi toàn công ty.
 */
@RestController
@RequestMapping("/api/v1/product-batches")
@RequiredArgsConstructor
public class ProductBatchTenantController {

    private final ProductBatchService productBatchService;

    /**
     * Lấy danh sách phân trang các lô thành phẩm ở phạm vi toàn doanh nghiệp (Tenant).
     * Hỗ trợ lọc theo từng trang trại cụ thể, trạng thái lô và từ khóa tìm kiếm.
     *
     * @param farmId   ID trang trại cụ thể nếu muốn lọc theo trang trại (tùy chọn)
     * @param status   Trạng thái lô cần lọc (tùy chọn)
     * @param keyword  Từ khóa tìm kiếm mã lô, tên sản phẩm hoặc mã QR (tùy chọn)
     * @param pageable Thông tin phân trang và sắp xếp (mặc định theo ID giảm dần)
     * @return Trang danh sách các lô sản phẩm chi tiết
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_FARM_VIEW')")
    public ResponseEntity<Page<ProductBatchDetailResponse>> getAllProductBatches(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(productBatchService.getProductBatches(farmId, status, keyword, pageable));
    }

    /**
     * Lấy thông tin chi tiết của một lô sản phẩm theo ID ở phạm vi doanh nghiệp.
     *
     * @param farmId ID trang trại (tùy chọn)
     * @param id     ID của lô sản phẩm cần xem
     * @return Chi tiết lô sản phẩm
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_FARM_VIEW')")
    public ResponseEntity<ProductBatchDetailResponse> getProductBatchById(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(productBatchService.getProductBatchById(farmId, id));
    }

    /**
     * Thu hồi khẩn cấp lô sản phẩm thành phẩm ở phạm vi doanh nghiệp/toàn hệ thống.
     *
     * @param farmId  ID trang trại (tùy chọn)
     * @param id      ID lô sản phẩm cần thu hồi
     * @param request Lý do và thông tin thu hồi
     * @return Thông tin lô sản phẩm sau khi cập nhật trạng thái RECALLED
     */
    @PostMapping("/{id}/recall")
    @PreAuthorize("hasAuthority('PERM_QC_RECALL')")
    public ResponseEntity<ProductBatchDetailResponse> recallBatch(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecallProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.recallBatch(farmId, id, request));
    }
}
