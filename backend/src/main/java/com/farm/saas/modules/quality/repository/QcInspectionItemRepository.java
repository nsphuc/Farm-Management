package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.QcInspectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository truy xuất danh sách các chỉ tiêu kiểm định chi tiết của biên bản KCS (QcInspectionItem).
 */
@Repository
public interface QcInspectionItemRepository extends JpaRepository<QcInspectionItem, Long>, JpaSpecificationExecutor<QcInspectionItem> {

    /**
     * Tìm danh sách các chỉ tiêu đo lường và đánh giá thuộc về một biên bản kiểm định KCS.
     *
     * @param inspectionId ID biên bản kiểm định KCS
     * @return Danh sách chỉ tiêu kiểm định
     */
    java.util.List<QcInspectionItem> findByInspectionId(Long inspectionId);
}
