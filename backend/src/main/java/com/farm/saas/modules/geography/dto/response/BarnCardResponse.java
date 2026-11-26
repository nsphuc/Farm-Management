package com.farm.saas.modules.geography.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarnCardResponse {

    private Long id;
    private String code;
    private String name;
    private Long zoneId;
    private String zoneName;
    private Long branchId;
    private BigDecimal areaM2;
    private Integer capacity;
    private String capacityUnit;
    private String status; // ACTIVE, EMPTY, ALERT, MAINTENANCE
    private String description;

    private BatchSummary currentBatch;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchSummary {
        private Long id;
        private String code;
        private Long breedId;
        private String breedName;
        private String species;
        private Integer daysOld;
        private Integer initialQuantity;
        private Integer currentQuantity;
        private BigDecimal avgWeightKg;
        private BigDecimal targetWeightKg;
        private BigDecimal fcr;
        private BigDecimal standardFcr;
        private BigDecimal mortalityRate;
        private BigDecimal feedConsumedTodayKg;
        private Boolean isAlert;
    }
}
