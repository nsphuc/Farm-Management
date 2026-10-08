package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.BudgetLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetLineItemRepository extends JpaRepository<BudgetLineItem, Long> {

    List<BudgetLineItem> findByBudgetId(Long budgetId);

    void deleteByBudgetId(Long budgetId);
}
