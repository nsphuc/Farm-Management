package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.WarehouseReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseReceiptRepository extends JpaRepository<WarehouseReceipt, Long> {

    Optional<WarehouseReceipt> findByIdAndTenantId(Long id, Long tenantId);

    Optional<WarehouseReceipt> findByTenantIdAndReceiptCode(Long tenantId, String receiptCode);

    boolean existsByTenantIdAndReceiptCode(Long tenantId, String receiptCode);

    @Query("SELECT r FROM WarehouseReceipt r WHERE r.tenantId = :tenantId " +
           "AND (:farmId IS NULL OR r.farmId = :farmId) " +
           "AND (:warehouseId IS NULL OR r.warehouseId = :warehouseId) " +
           "AND (:status IS NULL OR :status = '' OR r.status = :status) " +
           "ORDER BY r.receiptDate DESC")
    Page<WarehouseReceipt> searchReceipts(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("warehouseId") Long warehouseId,
            @Param("status") String status,
            Pageable pageable
    );
}
