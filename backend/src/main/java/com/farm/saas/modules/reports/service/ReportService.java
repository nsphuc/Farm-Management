package com.farm.saas.modules.reports.service;

import com.farm.saas.modules.reports.dto.*;

public interface ReportService {

    ExecutiveDashboardResponse getExecutiveDashboard(Long farmId, Integer fiscalYear);

    InventoryAgingResponse getInventoryAging(Long farmId);

    CropCostProfitResponse getCropCostProfit(Long farmId);

    LivestockFcrResponse getLivestockFcr(Long farmId, Long groupId);

    DebtAgingResponse getDebtAging(Long farmId);
}
