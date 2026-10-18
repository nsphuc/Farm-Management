package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesDeliveryRepository extends JpaRepository<SalesDelivery, Long>, JpaSpecificationExecutor<SalesDelivery> {
}
