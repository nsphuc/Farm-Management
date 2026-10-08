package com.farmsaas.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialPLReportDTO {
    private Integer year;
    private BigDecimal totalRevenue;
    private BigDecimal directCosts;
    private BigDecimal indirectCosts;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    private BigDecimal profitMarginPercentage;
    private BigDecimal roiPercentage;

    private BigDecimal totalReceivableDebt;
    private BigDecimal totalPayableDebt;

    private List<MonthlyPLDTO> monthlyPL;
    private List<ExpenseCategoryBreakdownDTO> expenseBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyPLDTO {
        private Integer month;
        private String monthName;
        private BigDecimal revenue;
        private BigDecimal expense;
        private BigDecimal profit;
        private BigDecimal marginPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseCategoryBreakdownDTO {
        private Long categoryId;
        private String categoryName;
        private String categoryCode;
        private BigDecimal amount;
        private BigDecimal percentage;
    }
}
