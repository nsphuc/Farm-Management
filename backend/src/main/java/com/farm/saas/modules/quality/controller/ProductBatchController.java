package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import com.farm.saas.modules.quality.service.ProductBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller quản lý các lô sản phẩm thành phẩm (Product Batch) theo từng trang trại.
 * Cung cấp các thao tác: đóng lô mới, danh sách phân trang, chi tiết, phê duyệt/từ chối KCS,
 * thu hồi lô sản phẩm vi phạm và in tem nhãn QR truy xuất nguồn gốc.
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/product-batches")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService productBatchService;

    /**
     * Tạo mới một lô thành phẩm từ các nguồn thu hoạch hoặc vụ mùa/đàn nuôi tương ứng.
     * Khởi tạo mã lô, mã GTIN, thiết lập trạng thái ban đầu và định lượng ban đầu.
     *
     * @param farmId  ID của trang trại thực hiện đóng lô
     * @param request Dữ liệu yêu cầu tạo lô sản phẩm (tên sản phẩm, kho lưu trữ, số lượng, nguồn gốc...)
     * @return Thông tin chi tiết của lô sản phẩm vừa tạo cùng mã trạng thái 201 CREATED
     */
    @PostMapping
    @PreAuthorize("(hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_LABEL_PRINT') or hasAnyRole('ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> createProductBatch(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateProductBatchRequest request) {
        ProductBatchDetailResponse response = productBatchService.createProductBatch(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách phân trang các lô thành phẩm trong trang trại có hỗ trợ lọc theo trạng thái và từ khóa tìm kiếm.
     *
     * @param farmId   ID trang trại
     * @param status   Trạng thái lô cần lọc (PENDING_APPROVAL, APPROVED, REJECTED, RECALLED, PRINTED...)
     * @param keyword  Từ khóa tìm kiếm theo mã lô, tên sản phẩm hoặc mã truy xuất
     * @param pageable Thông tin phân trang và sắp xếp dữ liệu
     * @return Trang danh sách các lô sản phẩm chi tiết
     */
    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW', 'PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<ProductBatchDetailResponse>> getProductBatches(
            @PathVariable Long farmId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productBatchService.getProductBatches(farmId, status, keyword, pageable));
    }

    /**
     * Lấy thông tin chi tiết đầy đủ của một lô thành phẩm theo ID (kèm thông tin KCS, bản chụp truy xuất và lịch sử in ấn).
     *
     * @param farmId ID trang trại
     * @param id     ID của lô sản phẩm cần xem
     * @return Chi tiết thông tin lô sản phẩm
     */
    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW', 'PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> getProductBatchById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(productBatchService.getProductBatchById(farmId, id));
    }

    /**
     * Phê duyệt chất lượng KCS cho lô thành phẩm (chuyển sang trạng thái APPROVED/READY_TO_PRINT),
     * đồng thời khởi tạo bản chụp truy xuất nguồn gốc bất biến (Traceability Snapshot) và băm SHA-256.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm cần phê duyệt
     * @param request Dữ liệu bổ sung khi phê duyệt (ghi chú, ngày phê duyệt...)
     * @return Thông tin lô sản phẩm sau khi đã được phê duyệt
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERM_QC_APPROVE') and @farmSecurity.canApproveBatch(#farmId, #id)")
    public ResponseEntity<ProductBatchDetailResponse> approveBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApproveProductBatchRequest request) {
        if (request == null) {
            request = new ApproveProductBatchRequest();
        }
        return ResponseEntity.ok(productBatchService.approveBatch(farmId, id, request));
    }

    /**
     * Từ chối phê duyệt chất lượng lô sản phẩm khi không đạt yêu cầu kiểm định KCS.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm cần từ chối
     * @param request Lý do và thông tin chi tiết từ chối lô sản phẩm
     * @return Thông tin lô sản phẩm sau khi cập nhật trạng thái REJECTED
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_QC_APPROVE') and @farmSecurity.canApproveBatch(#farmId, #id)")
    public ResponseEntity<ProductBatchDetailResponse> rejectBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RejectProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.rejectBatch(farmId, id, request));
    }

    /**
     * Thu hồi khẩn cấp một lô sản phẩm thành phẩm (chuyển sang trạng thái RECALLED).
     * Cảnh báo công khai khi người tiêu dùng quét mã QR truy xuất nguồn gốc.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm bị thu hồi
     * @param request Lý do và nội dung thu hồi lô sản phẩm
     * @return Thông tin lô sản phẩm sau khi bị thu hồi
     */
    @PostMapping("/{id}/recall")
    @PreAuthorize("hasAuthority('PERM_QC_RECALL') and @farmSecurity.isFarmManagerOrOwner(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> recallBatch(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody RecallProductBatchRequest request) {
        return ResponseEntity.ok(productBatchService.recallBatch(farmId, id, request));
    }

    /**
     * Ghi nhận lịch sử in tem nhãn QR truy xuất nguồn gốc cho lô sản phẩm (chuyển sang trạng thái PRINTED).
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm cần in tem
     * @param request Số lượng tem in, kích thước tem và ghi chú in ấn
     * @return Thông tin chi tiết lô sản phẩm sau khi ghi nhận in tem
     */
    @PostMapping("/{id}/print-label")
    @PreAuthorize("hasAnyAuthority('PERM_LABEL_PRINT', 'PERM_QC_APPROVE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductBatchDetailResponse> printLabel(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody PrintLabelRequest request) {
        return ResponseEntity.ok(productBatchService.printLabel(farmId, id, request));
    }
}
