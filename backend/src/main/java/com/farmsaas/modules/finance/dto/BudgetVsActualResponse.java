package com.farmsaas.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetVsActualResponse {

    private Long farmId;
    private Long seasonId;
    private String seasonCode;
    private Long budgetId;
    private String budgetTitle;
    private BigDecimal totalBudget;
    private BigDecimal totalActual;
    private BigDecimal totalVariance;
    private BigDecimal variancePercent; // Tỷ lệ chênh lệch (%)

    private List<BudgetLineComparisonDto> comparisons;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetLineComparisonDto {
        private Long categoryId;
        private String categoryCode;
        private String categoryName;
        private BigDecimal plannedAmount;
        private BigDecimal actualAmount;
        private BigDecimal variance;       // planned - actual
        private BigDecimal variancePercent;// (actual / planned) * 100
        private String status;             // UNDER_BUDGET, OVER_BUDGET, ON_TRACK
    }
}
