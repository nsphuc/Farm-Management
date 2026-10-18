package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseReceiptItemRepository extends JpaRepository<WarehouseReceiptItem, Long>, JpaSpecificationExecutor<WarehouseReceiptItem> {
}
