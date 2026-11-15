package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockCostProfitResponse {

    private List<LivestockGroupFinancialSummary> groups;
    private BigDecimal overallRevenue;
    private BigDecimal overallCost;
    private BigDecimal overallGrossProfit;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivestockGroupFinancialSummary {
        private Long groupId;
        private String groupCode;
        private String groupName;
        private String breedName;
        private String species;
        private Long operationalCycleId;
        private String cycleName;
        private Integer initialQuantity;
        private Integer currentQuantity;
        private BigDecimal initialCost;
        private BigDecimal directExpense;
        private BigDecimal allocatedCost;
        private BigDecimal totalCost;
        private BigDecimal actualYield;
        private String yieldUnit;
        private BigDecimal unitCost;
        private BigDecimal revenue;
        private BigDecimal grossProfit;
        private BigDecimal grossMarginPct;
        private String status;
        private String entryDate;
    }
}

