package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.FarmExpense;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FarmExpenseRepository extends JpaRepository<FarmExpense, Long> {

    Optional<FarmExpense> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    boolean existsByTenantIdAndFarmIdAndExpenseCode(Long tenantId, Long farmId, String expenseCode);

    List<FarmExpense> findByTenantIdAndFarmIdAndSeasonId(Long tenantId, Long farmId, Long seasonId);

    List<FarmExpense> findByTenantIdAndFarmIdAndHerdId(Long tenantId, Long farmId, Long herdId);

    @Query("SELECT e FROM FarmExpense e " +
           "JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.season " +
           "LEFT JOIN FETCH e.herd " +
           "LEFT JOIN FETCH e.recipientPartner " +
           "WHERE e.tenantId = :tenantId AND e.farmId = :farmId " +
           "AND (:categoryId IS NULL OR e.categoryId = :categoryId) " +
           "AND (:seasonId IS NULL OR e.seasonId = :seasonId) " +
           "AND (:herdId IS NULL OR e.herdId = :herdId) " +
           "AND (:paymentMethod IS NULL OR e.paymentMethod = :paymentMethod) " +
           "AND (:fromDate IS NULL OR e.expenseDate >= :fromDate) " +
           "AND (:toDate IS NULL OR e.expenseDate <= :toDate) " +
           "AND (:keyword IS NULL OR LOWER(e.expenseCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(e.notes) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(e.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY e.expenseDate DESC, e.createdAt DESC")
    Page<FarmExpense> searchExpenses(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("categoryId") Long categoryId,
            @Param("seasonId") Long seasonId,
            @Param("herdId") Long herdId,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e " +
           "WHERE e.tenantId = :tenantId AND e.farmId = :farmId AND e.seasonId = :seasonId")
    BigDecimal sumAmountBySeasonId(@Param("tenantId") Long tenantId, @Param("farmId") Long farmId, @Param("seasonId") Long seasonId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FarmExpense e " +
           "WHERE e.tenantId = :tenantId AND e.farmId = :farmId AND e.herdId = :herdId")
    BigDecimal sumAmountByHerdId(@Param("tenantId") Long tenantId, @Param("farmId") Long farmId, @Param("herdId") Long herdId);
}
