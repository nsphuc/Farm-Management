package com.farm.saas.modules.reports.service;

import com.farm.saas.modules.reports.dto.*;

public interface ReportService {

    ExecutiveDashboardResponse getExecutiveDashboard(Long farmId, Integer fiscalYear);

    InventoryAgingResponse getInventoryAging(Long farmId);

    default CropCostProfitResponse getCropCostProfit(Long farmId) {
        return getCropCostProfit(farmId, null);
    }

    CropCostProfitResponse getCropCostProfit(Long farmId, Long cycleId);

    LivestockCostProfitResponse getLivestockCostProfit(Long farmId, Long cycleId);

    LivestockFcrResponse getLivestockFcr(Long farmId, Long groupId);

    DebtAgingResponse getDebtAging(Long farmId);
}
