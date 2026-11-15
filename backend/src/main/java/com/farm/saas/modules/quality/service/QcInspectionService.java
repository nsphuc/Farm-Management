package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.QcInspectionRequest;
import com.farm.saas.modules.quality.dto.response.QcInspectionDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ nghiệp vụ kiểm tra và chứng nhận chất lượng KCS (QC Inspection).
 */
public interface QcInspectionService {

    /**
     * Tạo biên bản kiểm định chất lượng KCS mới cho một lô sản phẩm thành phẩm.
     *
     * @param farmId  ID trang trại thực hiện kiểm định
     * @param request Dữ liệu biên bản kiểm tra và danh sách chỉ tiêu đo lường
     * @return Chi tiết biên bản kiểm định KCS vừa tạo
     */
    QcInspectionDetailResponse createInspection(Long farmId, QcInspectionRequest request);

    /**
     * Lấy danh sách phân trang các biên bản kiểm định KCS trong một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách biên bản kiểm định
     */
    Page<QcInspectionDetailResponse> getInspections(Long farmId, Pageable pageable);

    /**
     * Lấy chi tiết biên bản kiểm định KCS theo ID.
     *
     * @param farmId ID trang trại
     * @param id     ID biên bản kiểm định
     * @return Chi tiết biên bản kiểm định kèm kết quả từng chỉ tiêu
     */
    QcInspectionDetailResponse getInspectionById(Long farmId, Long id);
}
