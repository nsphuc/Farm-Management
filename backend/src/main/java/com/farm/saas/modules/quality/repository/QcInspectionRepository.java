package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.QcInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository truy xuất và thao tác dữ liệu biên bản kiểm định chất lượng KCS (QcInspection).
 */
@Repository
public interface QcInspectionRepository extends JpaRepository<QcInspection, Long>, JpaSpecificationExecutor<QcInspection> {

    /**
     * Tìm danh sách các biên bản kiểm định KCS liên quan đến một lô sản phẩm theo thứ tự mới nhất.
     *
     * @param productBatchId ID lô sản phẩm
     * @return Danh sách biên bản kiểm định KCS
     */
    java.util.List<QcInspection> findByProductBatchIdOrderByCreatedAtDesc(Long productBatchId);

    /**
     * Tìm biên bản kiểm định KCS mới nhất của một lô sản phẩm (phục vụ Maker-Checker và phê duyệt).
     *
     * @param productBatchId ID lô sản phẩm
     * @return Optional chứa biên bản kiểm định KCS mới nhất nếu có
     */
    java.util.Optional<QcInspection> findTopByProductBatchIdOrderByCreatedAtDesc(Long productBatchId);

    /**
     * Tìm biên bản kiểm định KCS theo mã kiểm định trong phạm vi doanh nghiệp và trang trại.
     *
     * @param tenantId       ID khách thuê / doanh nghiệp
     * @param farmId         ID trang trại
     * @param inspectionCode Mã biên bản kiểm định KCS
     * @return Optional chứa biên bản kiểm định KCS nếu tìm thấy
     */
    java.util.Optional<QcInspection> findByTenantIdAndFarmIdAndInspectionCode(Long tenantId, Long farmId, String inspectionCode);

    /**
     * Lấy danh sách phân trang các biên bản kiểm định KCS của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách biên bản kiểm định KCS
     */
    org.springframework.data.domain.Page<QcInspection> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
}
