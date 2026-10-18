package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.FarmExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FarmExpenseRepository extends JpaRepository<FarmExpense, Long>, JpaSpecificationExecutor<FarmExpense> {

    boolean existsByTenantIdAndFarmIdAndExpenseCode(Long tenantId, Long farmId, String expenseCode);

    Optional<FarmExpense> findByTenantIdAndFarmIdAndExpenseCode(Long tenantId, Long farmId, String expenseCode);

    Page<FarmExpense> findByFarmId(Long farmId, Pageable pageable);

    List<FarmExpense> findByFarmId(Long farmId);

    List<FarmExpense> findByTenantId(Long tenantId);

    List<FarmExpense> findBySeasonIdAndStatusAndUnitCostEligibleTrue(Long seasonId, String status);

    List<FarmExpense> findByLivestockGroupIdAndStatusAndUnitCostEligibleTrue(Long livestockGroupId, String status);

    List<FarmExpense> findByFarmIdAndStatus(Long farmId, String status);

    List<FarmExpense> findByTenantIdAndStatus(Long tenantId, String status);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e WHERE e.seasonId = :seasonId AND e.status = 'CONFIRMED'")
    BigDecimal sumConfirmedExpensesBySeasonId(@Param("seasonId") Long seasonId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e WHERE e.livestockGroupId = :groupId AND e.status = 'CONFIRMED'")
    BigDecimal sumConfirmedExpensesByLivestockGroupId(@Param("groupId") Long groupId);
}
