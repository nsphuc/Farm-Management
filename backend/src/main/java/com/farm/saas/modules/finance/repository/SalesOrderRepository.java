package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SalesOrder s WHERE s.id = :id")
    Optional<SalesOrder> findByIdForUpdate(@Param("id") Long id);

    Optional<SalesOrder> findByTenantIdAndFarmIdAndOrderCode(Long tenantId, Long farmId, String orderCode);

    Page<SalesOrder> findByFarmId(Long farmId, Pageable pageable);

    Page<SalesOrder> findByTenantId(Long tenantId, Pageable pageable);

    List<SalesOrder> findByFarmId(Long farmId);

    List<SalesOrder> findByTenantId(Long tenantId);

    List<SalesOrder> findByPartnerId(Long partnerId);
}
