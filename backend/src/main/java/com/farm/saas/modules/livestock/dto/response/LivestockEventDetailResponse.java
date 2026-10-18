package com.farm.saas.modules.livestock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockEventDetailResponse {
    private Long id;
    private Long farmId;
    private String targetType;
    private Long livestockGroupId;
    private String groupCode;
    private Long livestockIndividualId;
    private String rfidTagCode;
    private String eventType;
    private LocalDate eventDate;
    private Integer withdrawalDays;
    private LocalDate withdrawalEndDate;
    private Boolean isQuarantined;
    private String detailsJson;
    private Long veterinarianUserId;
    private String veterinarianUserName;
    private Boolean isInventoryBackflushed;
    private List<LivestockEventSupplyDto> supplies;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivestockEventSupplyDto {
        private Long id;
        private Long materialId;
        private String skuCode;
        private String materialName;
        private Long warehouseId;
        private String warehouseName;
        private String batchNumber;
        private BigDecimal actualQuantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private Long warehouseIssueItemId;
        private String notes;
    }
}
