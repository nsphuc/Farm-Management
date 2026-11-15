package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ nghiệp vụ quản lý thu hoạch nông sản và xuất bán vật nuôi.
 */
public interface HarvestService {

    /**
     * Tạo mới một biên bản thu hoạch, kiểm soát thời gian cách ly PHI,
     * tự động tạo lô thành phẩm và phiếu nhập kho tương ứng nếu đủ điều kiện.
     *
     * @param farmId  ID trang trại thực hiện thu hoạch
     * @param request Dữ liệu thông tin biên bản thu hoạch
     * @return Thông tin chi tiết biên bản thu hoạch vừa tạo
     */
    HarvestRecordDetailResponse createHarvestRecord(Long farmId, CreateHarvestRecordRequest request);

    /**
     * Lấy danh sách phân trang các biên bản thu hoạch của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách biên bản thu hoạch
     */
    Page<HarvestRecordDetailResponse> getHarvestRecords(Long farmId, Pageable pageable);

    /**
     * Lấy chi tiết biên bản thu hoạch theo ID.
     *
     * @param farmId ID trang trại
     * @param id     ID biên bản thu hoạch
     * @return Chi tiết biên bản thu hoạch
     */
    HarvestRecordDetailResponse getHarvestRecordById(Long farmId, Long id);
}
