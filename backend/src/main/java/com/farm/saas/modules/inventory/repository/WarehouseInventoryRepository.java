package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, Long>, JpaSpecificationExecutor<WarehouseInventory> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM WarehouseInventory e WHERE e.id = :id")
    Optional<WarehouseInventory> findByIdForUpdate(@Param("id") Long id);

    java.util.Optional<WarehouseInventory> findByFarmIdAndInternalBatchBarcode(Long farmId, String internalBatchBarcode);
    java.util.List<WarehouseInventory> findByFarmIdAndMaterialId(Long farmId, Long materialId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM WarehouseInventory e WHERE e.warehouseId = :warehouseId AND e.materialId = :materialId AND e.batchNumber = :batchNumber")
    Optional<WarehouseInventory> findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
            @Param("warehouseId") Long warehouseId,
            @Param("materialId") Long materialId,
            @Param("batchNumber") String batchNumber
    );

    Optional<WarehouseInventory> findByWarehouseIdAndMaterialIdAndBatchNumber(
            Long warehouseId,
            Long materialId,
            String batchNumber
    );

    java.util.List<WarehouseInventory> findByFarmId(Long farmId);
    java.util.List<WarehouseInventory> findByTenantId(Long tenantId);
}
