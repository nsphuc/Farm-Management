package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.QcInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface QcInspectionRepository extends JpaRepository<QcInspection, Long>, JpaSpecificationExecutor<QcInspection> {
    java.util.List<QcInspection> findByProductBatchIdOrderByCreatedAtDesc(Long productBatchId);
    java.util.Optional<QcInspection> findTopByProductBatchIdOrderByCreatedAtDesc(Long productBatchId);
    java.util.Optional<QcInspection> findByTenantIdAndFarmIdAndInspectionCode(Long tenantId, Long farmId, String inspectionCode);
    org.springframework.data.domain.Page<QcInspection> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
}
