package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.QcInspectionRequest;
import com.farm.saas.modules.quality.dto.response.QcInspectionDetailResponse;
import com.farm.saas.modules.quality.service.QcInspectionService;
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
 * REST Controller quản lý hoạt động kiểm định chất lượng (KCS / QC Inspection) tại trang trại.
 * Cung cấp API lập biên bản kiểm định mẫu, ghi nhận các chỉ tiêu đo đạc, tra cứu danh sách và xem chi tiết biên bản.
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/qc-inspections")
@RequiredArgsConstructor
public class QcInspectionController {

    private final QcInspectionService qcInspectionService;

    /**
     * Lập biên bản kiểm định chất lượng KCS mới cho một lô sản phẩm thành phẩm.
     * Lưu trữ chi tiết mẫu kiểm định, kết quả từng tiêu chí đo lường thực tế so với tiêu chuẩn,
     * đồng thời gửi thông báo tự động tới Giám đốc trang trại để chờ phê duyệt.
     *
     * @param farmId  ID trang trại thực hiện kiểm định
     * @param request Dữ liệu yêu cầu kiểm định KCS (mã lô, quy cách mẫu, danh sách chỉ tiêu, kết quả tổng quát...)
     * @return Thông tin chi tiết biên bản kiểm định KCS vừa lập cùng mã trạng thái 201 CREATED
     */
    @PostMapping
    @PreAuthorize("(hasAuthority('PERM_QC_INSPECT') or hasRole('ROLE_TECHNICAL_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<QcInspectionDetailResponse> createInspection(
            @PathVariable Long farmId,
            @Valid @RequestBody QcInspectionRequest request) {
        QcInspectionDetailResponse response = qcInspectionService.createInspection(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách phân trang các biên bản kiểm định KCS trong một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang và sắp xếp dữ liệu
     * @return Trang danh sách các biên bản kiểm định KCS chi tiết
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<QcInspectionDetailResponse>> getInspections(
            @PathVariable Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(qcInspectionService.getInspections(farmId, pageable));
    }

    /**
     * Lấy thông tin chi tiết một biên bản kiểm định KCS theo ID.
     *
     * @param farmId ID trang trại
     * @param id     ID của biên bản kiểm định KCS cần xem
     * @return Chi tiết biên bản kiểm định cùng danh sách kết quả từng chỉ tiêu đo đạc
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<QcInspectionDetailResponse> getInspectionById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(qcInspectionService.getInspectionById(farmId, id));
    }
}
