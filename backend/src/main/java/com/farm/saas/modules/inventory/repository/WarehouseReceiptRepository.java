package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

public interface WarehouseReceiptRepository extends JpaRepository<WarehouseReceipt, Long>, JpaSpecificationExecutor<WarehouseReceipt> {
    java.util.Optional<WarehouseReceipt> findByFarmIdAndId(Long farmId, Long id);
    java.util.Optional<WarehouseReceipt> findByTenantIdAndFarmIdAndReceiptCode(Long tenantId, Long farmId, String receiptCode);
    boolean existsByTenantIdAndFarmIdAndReceiptCode(Long tenantId, Long farmId, String receiptCode);
    boolean existsByWarehouseId(Long warehouseId);
}
