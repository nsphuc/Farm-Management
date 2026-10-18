package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseTransferItemRepository extends JpaRepository<WarehouseTransferItem, Long>, JpaSpecificationExecutor<WarehouseTransferItem> {
}
