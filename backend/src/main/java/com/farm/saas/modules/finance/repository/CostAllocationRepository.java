package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.CostAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CostAllocationRepository extends JpaRepository<CostAllocation, Long>, JpaSpecificationExecutor<CostAllocation> {
}
