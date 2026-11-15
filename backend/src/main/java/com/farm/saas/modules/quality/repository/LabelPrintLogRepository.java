package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.LabelPrintLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository lưu trữ và tra cứu lịch sử in ấn tem nhãn QR truy xuất nguồn gốc của lô sản phẩm.
 */
@Repository
public interface LabelPrintLogRepository extends JpaRepository<LabelPrintLog, Long>, JpaSpecificationExecutor<LabelPrintLog> {

    /**
     * Tìm danh sách lịch sử in tem của lô sản phẩm theo thứ tự thời điểm in giảm dần.
     *
     * @param productBatchId ID lô sản phẩm thành phẩm
     * @return Danh sách lịch sử in tem nhãn
     */
    java.util.List<LabelPrintLog> findByProductBatchIdOrderByPrintedAtDesc(Long productBatchId);
}
