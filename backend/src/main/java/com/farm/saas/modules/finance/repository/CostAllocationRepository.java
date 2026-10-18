package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.CostAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CostAllocationRepository extends JpaRepository<CostAllocation, Long>, JpaSpecificationExecutor<CostAllocation> {

    List<CostAllocation> findByExpenseId(Long expenseId);

    List<CostAllocation> findByTargetTypeAndTargetId(String targetType, Long targetId);

    @Query("SELECT COALESCE(SUM(ca.allocatedAmount), 0) FROM CostAllocation ca WHERE ca.expenseId = :expenseId")
    BigDecimal sumAllocatedAmountByExpenseId(@Param("expenseId") Long expenseId);

    @Query("SELECT COALESCE(SUM(ca.allocatedAmount), 0) FROM CostAllocation ca WHERE ca.targetType = :targetType AND ca.targetId = :targetId")
    BigDecimal sumAllocatedAmountByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);
}
