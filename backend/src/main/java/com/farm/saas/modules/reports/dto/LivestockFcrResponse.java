package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockFcrResponse {

    private List<LivestockGroupFcrSummary> groups;
    private BigDecimal averageFcr;
    private BigDecimal overallSurvivalRate;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivestockGroupFcrSummary {
        private Long groupId;
        private String groupCode;
        private String groupName;
        private String species;
        private BigDecimal totalFeedConsumedKg;
        private BigDecimal totalWeightGainKg;
        private BigDecimal fcr;
        private Integer initialQuantity;
        private Integer currentQuantity;
        private BigDecimal survivalRatePct;
    }
}
