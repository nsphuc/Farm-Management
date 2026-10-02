package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.WarehouseInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, Long> {

    List<WarehouseInventory> findByTenantIdAndWarehouseId(Long tenantId, Long warehouseId);

    List<WarehouseInventory> findByTenantIdAndWarehouseIdAndMaterialId(Long tenantId, Long warehouseId, Long materialId);

    Optional<WarehouseInventory> findByWarehouseIdAndMaterialIdAndBatchNumber(Long warehouseId, Long materialId, String batchNumber);

    /**
     * Pessimistic write lock for precise batch backflushing and withdrawal.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wi FROM WarehouseInventory wi WHERE wi.warehouseId = :warehouseId AND wi.materialId = :materialId AND wi.batchNumber = :batchNumber")
    Optional<WarehouseInventory> findWithLock(
            @Param("warehouseId") Long warehouseId,
            @Param("materialId") Long materialId,
            @Param("batchNumber") String batchNumber
    );

    /**
     * Pessimistic write lock for FIFO consumption.
     * Orders batches by earliest expiry date first, then by earliest creation ID.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wi FROM WarehouseInventory wi WHERE wi.warehouseId = :warehouseId AND wi.materialId = :materialId AND wi.quantityOnHand > 0 " +
           "ORDER BY COALESCE(wi.expiryDate, '9999-12-31') ASC, wi.id ASC")
    List<WarehouseInventory> findAvailableForFifoWithLock(
            @Param("warehouseId") Long warehouseId,
            @Param("materialId") Long materialId
    );

    /**
     * Find materials near expiry date (< targetDate).
     */
    @Query("SELECT wi FROM WarehouseInventory wi JOIN FETCH wi.material m JOIN FETCH wi.warehouse w " +
           "WHERE wi.tenantId = :tenantId AND wi.expiryDate IS NOT NULL AND wi.expiryDate <= :targetDate AND wi.quantityOnHand > 0 " +
           "ORDER BY wi.expiryDate ASC")
    List<WarehouseInventory> findExpiringBatches(
            @Param("tenantId") Long tenantId,
            @Param("targetDate") LocalDate targetDate
    );

    /**
     * Query inventory by warehouse with joined material details.
     */
    @Query("SELECT wi FROM WarehouseInventory wi JOIN FETCH wi.material m " +
           "WHERE wi.tenantId = :tenantId AND wi.warehouseId = :warehouseId " +
           "ORDER BY m.name ASC, wi.expiryDate ASC")
    List<WarehouseInventory> findInventoryByWarehouseWithMaterial(
            @Param("tenantId") Long tenantId,
            @Param("warehouseId") Long warehouseId
    );

    @Query("SELECT wi FROM WarehouseInventory wi JOIN FETCH wi.material m JOIN FETCH wi.warehouse w " +
           "WHERE wi.tenantId = :tenantId AND w.farmId = :farmId " +
           "ORDER BY m.name ASC, wi.expiryDate ASC")
    List<WarehouseInventory> findInventoryByFarmWithMaterial(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId
    );
}
