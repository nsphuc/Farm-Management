package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;

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
}
