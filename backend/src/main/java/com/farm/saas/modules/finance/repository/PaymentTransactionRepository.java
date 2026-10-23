package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long>, JpaSpecificationExecutor<PaymentTransaction> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE p.id = :id")
    Optional<PaymentTransaction> findByIdForUpdate(@Param("id") Long id);

    Optional<PaymentTransaction> findByTenantIdAndFarmIdAndPaymentCode(Long tenantId, Long farmId, String paymentCode);

    Page<PaymentTransaction> findByFarmId(Long farmId, Pageable pageable);

    Page<PaymentTransaction> findByTenantId(Long tenantId, Pageable pageable);

    java.util.List<PaymentTransaction> findByFarmId(Long farmId);

    java.util.List<PaymentTransaction> findByTenantId(Long tenantId);
}
