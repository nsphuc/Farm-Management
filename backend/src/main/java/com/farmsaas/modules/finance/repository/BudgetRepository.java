package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.Budget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<Budget> findByTenantIdAndFarmIdAndSeasonId(Long tenantId, Long farmId, Long seasonId);

    boolean existsByTenantIdAndFarmIdAndBudgetCode(Long tenantId, Long farmId, String budgetCode);

    @Query("SELECT b FROM Budget b " +
           "LEFT JOIN FETCH b.season " +
           "WHERE b.tenantId = :tenantId AND b.farmId = :farmId " +
           "AND (:seasonId IS NULL OR b.seasonId = :seasonId) " +
           "AND (:keyword IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(b.budgetCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.createdAt DESC")
    Page<Budget> searchBudgets(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("seasonId") Long seasonId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
