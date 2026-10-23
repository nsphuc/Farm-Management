package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.ConfirmSettlementRequest;
import com.farm.saas.modules.finance.dto.response.CycleSettlementSummaryResponse;

import java.util.List;

public interface CycleSettlementService {

    List<CycleSettlementSummaryResponse> getCycleSettlements(Long farmId);

    CycleSettlementSummaryResponse getCycleSettlementSummary(Long farmId, Long cycleId);

    CycleSettlementSummaryResponse confirmSettlement(Long farmId, Long cycleId, ConfirmSettlementRequest request);

    CycleSettlementSummaryResponse approveSettlement(Long farmId, Long cycleId, ConfirmSettlementRequest request);
}
