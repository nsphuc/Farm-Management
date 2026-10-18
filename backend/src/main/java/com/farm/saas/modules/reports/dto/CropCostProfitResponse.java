package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropCostProfitResponse {

    private List<CropSeasonFinancialSummary> seasons;
    private BigDecimal overallRevenue;
    private BigDecimal overallCost;
    private BigDecimal overallGrossProfit;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CropSeasonFinancialSummary {
        private Long seasonId;
        private String seasonName;
        private String seasonCode;
        private String cropName;
        private BigDecimal plannedBudget;
        private BigDecimal actualCost;
        private BigDecimal actualYieldKg;
        private BigDecimal unitCostPerKg;
        private BigDecimal revenue;
        private BigDecimal grossProfit;
        private BigDecimal grossMarginPct;
    }
}
