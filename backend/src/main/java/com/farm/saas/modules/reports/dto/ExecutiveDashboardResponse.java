package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveDashboardResponse {

    private Integer fiscalYear;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpense;
    private BigDecimal grossProfit;
    private BigDecimal grossMarginPct;
    private BigDecimal totalHarvestYieldKg;
    private Long totalActiveSeasons;
    private Long totalActiveLivestockHeads;
    private BigDecimal totalInventoryValuation;
    private BigDecimal totalReceivableDebt;
    private BigDecimal totalPayableDebt;

    private List<MonthlyFinancialPoint> monthlyFinancials;
    private List<ExpenseCategoryPoint> expenseCategories;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyFinancialPoint {
        private String month;
        private BigDecimal revenue;
        private BigDecimal expense;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseCategoryPoint {
        private String name;
        private BigDecimal value;
    }
}

