package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.AllocateCostRequest;
import com.farm.saas.modules.finance.dto.request.CreateFarmExpenseRequest;
import com.farm.saas.modules.finance.dto.response.FarmExpenseDetailResponse;
import com.farm.saas.modules.finance.dto.response.UnitCostReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FarmExpenseService {

    Page<FarmExpenseDetailResponse> getExpenses(Long farmId, Pageable pageable);

    FarmExpenseDetailResponse getExpenseById(Long farmId, Long id);

    FarmExpenseDetailResponse createExpense(Long farmId, CreateFarmExpenseRequest request);

    FarmExpenseDetailResponse allocateCost(Long farmId, Long expenseId, AllocateCostRequest request);

    UnitCostReportResponse calculateUnitCost(Long farmId, String targetType, Long targetId);
}
