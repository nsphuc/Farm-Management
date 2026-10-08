package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.UnitCostCalculationResponse;

public interface CostCalculationService {

    UnitCostCalculationResponse calculateSeasonUnitCost(Long farmId, Long seasonId);

    UnitCostCalculationResponse calculateHerdUnitCost(Long farmId, Long herdId);
}
