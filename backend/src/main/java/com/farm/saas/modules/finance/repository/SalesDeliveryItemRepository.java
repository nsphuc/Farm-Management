package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesDeliveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesDeliveryItemRepository extends JpaRepository<SalesDeliveryItem, Long>, JpaSpecificationExecutor<SalesDeliveryItem> {

    List<SalesDeliveryItem> findByDeliveryId(Long deliveryId);

    List<SalesDeliveryItem> findBySalesOrderItemId(Long salesOrderItemId);
}
