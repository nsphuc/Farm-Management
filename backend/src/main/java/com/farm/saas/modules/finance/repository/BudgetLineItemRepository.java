package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.BudgetLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetLineItemRepository extends JpaRepository<BudgetLineItem, Long>, JpaSpecificationExecutor<BudgetLineItem> {

    List<BudgetLineItem> findByBudgetId(Long budgetId);

    Optional<BudgetLineItem> findByBudgetIdAndCostCategoryId(Long budgetId, Long costCategoryId);
}
