package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseTransferRepository extends JpaRepository<WarehouseTransfer, Long>, JpaSpecificationExecutor<WarehouseTransfer> {
    java.util.Optional<WarehouseTransfer> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndTransferCode(Long tenantId, String transferCode);
}
