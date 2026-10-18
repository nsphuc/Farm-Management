package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatch;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long>, JpaSpecificationExecutor<ProductBatch> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM ProductBatch e WHERE e.id = :id")
    Optional<ProductBatch> findByIdForUpdate(@Param("id") Long id);

    Optional<ProductBatch> findByTraceabilityCode(String traceabilityCode);
    Optional<ProductBatch> findByTenantIdAndFarmIdAndBatchCode(Long tenantId, Long farmId, String batchCode);
    java.util.List<ProductBatch> findByFarmIdOrderByCreatedAtDesc(Long farmId);
    org.springframework.data.domain.Page<ProductBatch> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
}
