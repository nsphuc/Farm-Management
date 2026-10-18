package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.FarmExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmExpenseRepository extends JpaRepository<FarmExpense, Long>, JpaSpecificationExecutor<FarmExpense> {
    boolean existsByTenantIdAndFarmIdAndExpenseCode(Long tenantId, Long farmId, String expenseCode);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e WHERE e.seasonId = :seasonId AND e.status = 'CONFIRMED'")
    java.math.BigDecimal sumConfirmedExpensesBySeasonId(@org.springframework.data.repository.query.Param("seasonId") Long seasonId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e WHERE e.livestockGroupId = :groupId AND e.status = 'CONFIRMED'")
    java.math.BigDecimal sumConfirmedExpensesByLivestockGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);
}
