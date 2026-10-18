package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAgingResponse {

    private AgingBucket bucket0To30;
    private AgingBucket bucket31To60;
    private AgingBucket bucket61To90;
    private AgingBucket bucketOver90;
    private BigDecimal totalValuation;
    private List<ExpiringBatchAlert> expiringBatches;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgingBucket {
        private Long itemCount;
        private BigDecimal totalQuantity;
        private BigDecimal totalValue;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringBatchAlert {
        private Long inventoryId;
        private Long materialId;
        private String materialName;
        private String lotNumber;
        private BigDecimal remainingQuantity;
        private LocalDate expiryDate;
        private Long daysUntilExpiry;
    }
}
