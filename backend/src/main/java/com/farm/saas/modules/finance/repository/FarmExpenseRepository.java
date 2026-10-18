package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.FarmExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmExpenseRepository extends JpaRepository<FarmExpense, Long>, JpaSpecificationExecutor<FarmExpense> {
}
