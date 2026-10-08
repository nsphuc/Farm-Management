package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.DebtRecord;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DebtRecordRepository extends JpaRepository<DebtRecord, Long> {

    Optional<DebtRecord> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<DebtRecord> findByTenantIdAndFarmIdAndOrderId(Long tenantId, Long farmId, Long orderId);

    List<DebtRecord> findByTenantIdAndFarmIdAndStatusNot(Long tenantId, Long farmId, DebtStatus status);

    @Query("SELECT d FROM DebtRecord d " +
           "JOIN FETCH d.partner " +
           "LEFT JOIN FETCH d.order " +
           "WHERE d.tenantId = :tenantId AND d.farmId = :farmId " +
           "AND (:partnerId IS NULL OR d.partnerId = :partnerId) " +
           "AND (:debtType IS NULL OR d.debtType = :debtType) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "ORDER BY d.dueDate ASC")
    Page<DebtRecord> searchDebts(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("partnerId") Long partnerId,
            @Param("debtType") DebtType debtType,
            @Param("status") DebtStatus status,
            Pageable pageable
    );
}
