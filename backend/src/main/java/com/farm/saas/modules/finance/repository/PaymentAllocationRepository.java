package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.PaymentAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long>, JpaSpecificationExecutor<PaymentAllocation> {

    List<PaymentAllocation> findByPaymentId(Long paymentId);

    List<PaymentAllocation> findByDebtRecordId(Long debtRecordId);

    Optional<PaymentAllocation> findByPaymentIdAndDebtRecordId(Long paymentId, Long debtRecordId);

    @Query("SELECT COALESCE(SUM(pa.allocatedAmount), 0) FROM PaymentAllocation pa WHERE pa.paymentId = :paymentId")
    BigDecimal sumAllocatedAmountByPaymentId(@Param("paymentId") Long paymentId);

    @Query("SELECT COALESCE(SUM(pa.allocatedAmount), 0) FROM PaymentAllocation pa WHERE pa.debtRecordId = :debtRecordId")
    BigDecimal sumAllocatedAmountByDebtRecordId(@Param("debtRecordId") Long debtRecordId);
}
