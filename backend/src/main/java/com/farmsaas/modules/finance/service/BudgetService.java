package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.BudgetRequest;
import com.farmsaas.modules.finance.dto.BudgetResponse;
import com.farmsaas.modules.finance.dto.BudgetVsActualResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BudgetService {

    BudgetResponse createBudget(Long farmId, BudgetRequest request);

    BudgetResponse updateBudget(Long farmId, Long id, BudgetRequest request);

    BudgetResponse getBudgetById(Long farmId, Long id);

    Page<BudgetResponse> searchBudgets(Long farmId, Long seasonId, String keyword, Pageable pageable);

    BudgetVsActualResponse getBudgetVsActual(Long farmId, Long seasonId);

    void deleteBudget(Long farmId, Long id);
}
