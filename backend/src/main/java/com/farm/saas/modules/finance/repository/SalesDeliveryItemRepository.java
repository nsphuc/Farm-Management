package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesDeliveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesDeliveryItemRepository extends JpaRepository<SalesDeliveryItem, Long>, JpaSpecificationExecutor<SalesDeliveryItem> {
}
