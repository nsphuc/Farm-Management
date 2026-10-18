package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseReceiptRepository extends JpaRepository<WarehouseReceipt, Long>, JpaSpecificationExecutor<WarehouseReceipt> {
}
