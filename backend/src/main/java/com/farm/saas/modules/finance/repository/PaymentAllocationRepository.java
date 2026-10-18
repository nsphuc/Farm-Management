package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.PaymentAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long>, JpaSpecificationExecutor<PaymentAllocation> {
}
