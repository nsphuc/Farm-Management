package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import com.farm.saas.modules.quality.service.HarvestService;
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
 * REST Controller quản lý thông tin thu hoạch nông sản và xuất bán vật nuôi của trang trại.
 * Cung cấp các API tạo biên bản thu hoạch, tra cứu danh sách và xem chi tiết theo ID.
 */
@RestController
@RequestMapping("/api/v1/farms/{farmId}/harvest-records")
@RequiredArgsConstructor
public class HarvestController {

    private final HarvestService harvestService;

    /**
     * Tạo mới một biên bản thu hoạch nông sản hoặc xuất bán vật nuôi.
     * Tự động kiểm tra thời gian cách ly (PHI), cập nhật trạng thái mùa vụ/đàn nuôi,
     * đồng thời hỗ trợ tự động sinh lô thành phẩm và phiếu nhập kho tương ứng.
     *
     * @param farmId  ID của trang trại thực hiện thu hoạch
     * @param request Dữ liệu yêu cầu tạo biên bản thu hoạch (vụ mùa/đàn nuôi, sản lượng, đơn vị tính, chất lượng...)
     * @return Thông tin chi tiết của biên bản thu hoạch vừa được tạo cùng mã trạng thái 201 CREATED
     */
    @PostMapping
    @PreAuthorize("(hasAuthority('PERM_HARVEST_MANAGE') or hasRole('ROLE_FARM_OWNER')) and (hasAnyRole('ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN') or @farmSecurity.isZoneManager(#farmId)) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<HarvestRecordDetailResponse> createHarvestRecord(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateHarvestRecordRequest request) {
        HarvestRecordDetailResponse response = harvestService.createHarvestRecord(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách phân trang các biên bản thu hoạch của một trang trại.
     *
     * @param farmId   ID của trang trại cần tra cứu
     * @param pageable Thông tin phân trang và sắp xếp dữ liệu
     * @return Trang danh sách biên bản thu hoạch chi tiết
     */
    @GetMapping
    @PreAuthorize("(hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_LABEL_PRINT', 'PERM_QC_INSPECT', 'PERM_QC_APPROVE') or hasAnyRole('ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Page<HarvestRecordDetailResponse>> getHarvestRecords(
            @PathVariable Long farmId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(harvestService.getHarvestRecords(farmId, pageable));
    }

    /**
     * Lấy thông tin chi tiết của một biên bản thu hoạch theo ID.
     *
     * @param farmId ID của trang trại sở hữu biên bản
     * @param id     ID của biên bản thu hoạch cần xem
     * @return Chi tiết biên bản thu hoạch
     */
    @GetMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_LABEL_PRINT', 'PERM_QC_INSPECT', 'PERM_QC_APPROVE') or hasAnyRole('ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER', 'ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<HarvestRecordDetailResponse> getHarvestRecordById(
            @PathVariable Long farmId,
            @PathVariable Long id) {
        return ResponseEntity.ok(harvestService.getHarvestRecordById(farmId, id));
    }
}
