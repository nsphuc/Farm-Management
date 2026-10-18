package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitCostReportResponse {

    private String targetType;
    private Long targetId;
    private String targetCode;
    private String targetName;
    private BigDecimal totalYieldKg;
    private BigDecimal directCost;
    private BigDecimal allocatedCost;
    private BigDecimal totalCost;
    private BigDecimal unitCostPerKg;
    private List<CostBreakdownDto> costBreakdown;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostBreakdownDto {
        private String costType;
        private String costTypeName;
        private BigDecimal amount;
        private Double percentage;
    }
}
