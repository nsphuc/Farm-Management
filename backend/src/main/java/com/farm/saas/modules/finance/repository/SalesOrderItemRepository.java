package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.SalesOrderItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long>, JpaSpecificationExecutor<SalesOrderItem> {

    List<SalesOrderItem> findBySalesOrderId(Long salesOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SalesOrderItem s WHERE s.id = :id")
    Optional<SalesOrderItem> findByIdForUpdate(@Param("id") Long id);
}
