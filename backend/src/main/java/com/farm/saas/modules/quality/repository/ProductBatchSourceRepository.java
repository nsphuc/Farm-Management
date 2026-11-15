package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatchSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository truy xuất nguồn gốc đóng góp cho lô sản phẩm thành phẩm (vụ mùa, đàn nuôi, biên bản thu hoạch).
 */
@Repository
public interface ProductBatchSourceRepository extends JpaRepository<ProductBatchSource, Long>, JpaSpecificationExecutor<ProductBatchSource> {

    /**
     * Tìm danh sách các nguồn đóng góp cấu thành nên một lô sản phẩm thành phẩm.
     *
     * @param productBatchId ID lô sản phẩm thành phẩm
     * @return Danh sách nguồn đóng góp
     */
    java.util.List<ProductBatchSource> findByProductBatchId(Long productBatchId);

    /**
     * Tìm danh sách các liên kết nguồn đóng góp xuất phát từ một biên bản thu hoạch cụ thể.
     *
     * @param harvestRecordId ID biên bản thu hoạch
     * @return Danh sách nguồn đóng góp
     */
    java.util.List<ProductBatchSource> findByHarvestRecordId(Long harvestRecordId);
}

