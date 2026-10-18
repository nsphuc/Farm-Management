package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long>, JpaSpecificationExecutor<SalesOrderItem> {
}
