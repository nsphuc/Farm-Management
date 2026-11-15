package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository lưu trữ và tra cứu bản chụp truy xuất nguồn gốc bất biến (TraceabilitySnapshot).
 */
@Repository
public interface TraceabilitySnapshotRepository extends JpaRepository<TraceabilitySnapshot, Long>, JpaSpecificationExecutor<TraceabilitySnapshot> {

    /**
     * Tìm bản chụp truy xuất nguồn gốc gắn liền với một lô sản phẩm thành phẩm.
     *
     * @param productBatchId ID lô sản phẩm thành phẩm
     * @return Optional chứa bản chụp truy xuất nguồn gốc
     */
    java.util.Optional<TraceabilitySnapshot> findByProductBatchId(Long productBatchId);
}
