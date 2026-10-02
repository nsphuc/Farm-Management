package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.WarehouseIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseIssueRepository extends JpaRepository<WarehouseIssue, Long> {

    Optional<WarehouseIssue> findByIdAndTenantId(Long id, Long tenantId);

    Optional<WarehouseIssue> findByTenantIdAndIssueCode(Long tenantId, String issueCode);

    boolean existsByTenantIdAndIssueCode(Long tenantId, String issueCode);

    @Query("SELECT i FROM WarehouseIssue i WHERE i.tenantId = :tenantId " +
           "AND (:farmId IS NULL OR i.farmId = :farmId) " +
           "AND (:warehouseId IS NULL OR i.warehouseId = :warehouseId) " +
           "AND (:issueType IS NULL OR :issueType = '' OR i.issueType = :issueType) " +
           "ORDER BY i.issueDate DESC")
    Page<WarehouseIssue> searchIssues(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("warehouseId") Long warehouseId,
            @Param("issueType") String issueType,
            Pageable pageable
    );
}
