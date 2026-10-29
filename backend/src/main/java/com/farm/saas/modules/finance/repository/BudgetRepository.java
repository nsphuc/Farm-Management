package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.Budget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long>, JpaSpecificationExecutor<Budget> {

    List<Budget> findByFarmIdAndFiscalYearAndStatus(Long farmId, Integer fiscalYear, String status);

    Optional<Budget> findByTenantIdAndFarmIdAndFiscalYearAndName(Long tenantId, Long farmId, Integer fiscalYear, String name);

    Page<Budget> findByFarmId(Long farmId, Pageable pageable);

    Page<Budget> findByTenantId(Long tenantId, Pageable pageable);

    Page<Budget> findByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    List<Budget> findByFarmIdAndFiscalYear(Long farmId, Integer fiscalYear);
    boolean existsByOperationalCycleId(Long operationalCycleId);
}
