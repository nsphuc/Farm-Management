package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.finance.dto.response.BudgetDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BudgetService {

    Page<BudgetDetailResponse> getBudgets(Long farmId, Pageable pageable);

    BudgetDetailResponse getBudgetById(Long farmId, Long id);

    BudgetDetailResponse createBudget(Long farmId, CreateBudgetRequest request);

    BudgetDetailResponse updateBudgetStatus(Long farmId, Long id, String status);
}
