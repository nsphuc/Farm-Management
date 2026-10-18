package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.DebtRecord;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DebtRecordRepository extends JpaRepository<DebtRecord, Long>, JpaSpecificationExecutor<DebtRecord> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM DebtRecord e WHERE e.id = :id")
    Optional<DebtRecord> findByIdForUpdate(@Param("id") Long id);

    Optional<DebtRecord> findByWarehouseReceiptId(Long warehouseReceiptId);

    Optional<DebtRecord> findBySalesOrderId(Long salesOrderId);

    List<DebtRecord> findByTenantIdAndPartnerIdAndDebtTypeAndStatusIn(
            Long tenantId, Long partnerId, String debtType, Collection<String> statuses);

    @Query("SELECT COALESCE(SUM(d.remainingDebt), 0) FROM DebtRecord d " +
            "WHERE d.tenantId = :tenantId AND d.partnerId = :partnerId AND d.debtType = :debtType " +
            "AND d.status IN ('ACTIVE', 'OVERDUE')")
    BigDecimal sumActiveDebtByPartnerId(
            @Param("tenantId") Long tenantId,
            @Param("partnerId") Long partnerId,
            @Param("debtType") String debtType);

    @Query("SELECT COALESCE(SUM(d.remainingDebt), 0) FROM DebtRecord d " +
            "WHERE d.partnerId = :partnerId AND d.debtType = 'RECEIVABLE' " +
            "AND d.status IN ('ACTIVE', 'OVERDUE')")
    BigDecimal sumActiveDebtByPartnerId(@Param("partnerId") Long partnerId);

    Page<DebtRecord> findByFarmId(Long farmId, Pageable pageable);

    Page<DebtRecord> findByTenantId(Long tenantId, Pageable pageable);

    List<DebtRecord> findByFarmId(Long farmId);

    List<DebtRecord> findByTenantId(Long tenantId);
}
