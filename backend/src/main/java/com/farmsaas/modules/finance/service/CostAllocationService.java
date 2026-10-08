package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.CostAllocationRequest;
import com.farmsaas.modules.finance.dto.CostAllocationResponse;

import java.util.List;

public interface CostAllocationService {

    CostAllocationResponse allocateCost(Long farmId, CostAllocationRequest request);

    List<CostAllocationResponse> getAllocationsByExpense(Long farmId, Long expenseId);

    List<CostAllocationResponse> getAllocationsBySeason(Long farmId, Long seasonId);

    void deleteAllocation(Long farmId, Long id);
}
