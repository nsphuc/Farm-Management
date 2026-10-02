package com.farmsaas.modules.traceability.repository;

import com.farmsaas.modules.traceability.entity.ProductBatch;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    Optional<ProductBatch> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<ProductBatch> findByTraceabilityCode(String traceabilityCode);

    boolean existsByTenantIdAndFarmIdAndBatchCode(Long tenantId, Long farmId, String batchCode);

    boolean existsByTraceabilityCode(String traceabilityCode);

    @Query("SELECT b FROM ProductBatch b WHERE b.tenantId = :tenantId AND b.farmId = :farmId " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:seasonId IS NULL OR b.seasonId = :seasonId) " +
           "AND (:livestockGroupId IS NULL OR b.livestockGroupId = :livestockGroupId) " +
           "AND (:keyword IS NULL OR LOWER(b.batchCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(b.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(b.traceabilityCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.createdAt DESC")
    Page<ProductBatch> searchBatches(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("status") ProductBatchStatus status,
            @Param("seasonId") Long seasonId,
            @Param("livestockGroupId") Long livestockGroupId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
