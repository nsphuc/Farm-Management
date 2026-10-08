package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.CostAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CostAllocationRepository extends JpaRepository<CostAllocation, Long> {

    Optional<CostAllocation> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    List<CostAllocation> findByTenantIdAndFarmIdAndExpenseId(Long tenantId, Long farmId, Long expenseId);

    List<CostAllocation> findByTenantIdAndFarmIdAndSeasonId(Long tenantId, Long farmId, Long seasonId);

    @Query("SELECT COALESCE(SUM(ca.allocatedAmount), 0) FROM CostAllocation ca " +
           "WHERE ca.tenantId = :tenantId AND ca.farmId = :farmId AND ca.seasonId = :seasonId")
    BigDecimal sumAllocatedAmountBySeasonId(@Param("tenantId") Long tenantId, @Param("farmId") Long farmId, @Param("seasonId") Long seasonId);
}
