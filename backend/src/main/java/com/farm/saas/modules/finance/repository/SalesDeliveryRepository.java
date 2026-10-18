package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesDeliveryRepository extends JpaRepository<SalesDelivery, Long>, JpaSpecificationExecutor<SalesDelivery> {

    Optional<SalesDelivery> findByTenantIdAndFarmIdAndDeliveryCode(Long tenantId, Long farmId, String deliveryCode);

    Page<SalesDelivery> findByFarmId(Long farmId, Pageable pageable);

    List<SalesDelivery> findBySalesOrderId(Long salesOrderId);
}
