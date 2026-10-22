package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiFarmExpenseSummaryResponse {

    private List<FarmExpenseSummaryItem> items;
    private BigDecimal totalMaterialsExpense;
    private BigDecimal totalLaborExpense;
    private BigDecimal totalOverheadExpense;
    private BigDecimal grandTotalExpense;
    private BigDecimal overallAvgUnitCost;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmExpenseSummaryItem {
        private Long farmId;
        private String farmName;
        private Long operationalCycleId;
        private String operationalCycleName;
        private BigDecimal materialExpense;
        private BigDecimal laborExpense;
        private BigDecimal overheadExpense;
        private BigDecimal totalExpense;
        private BigDecimal totalYieldKg;
        private BigDecimal avgUnitCost;
    }
}
