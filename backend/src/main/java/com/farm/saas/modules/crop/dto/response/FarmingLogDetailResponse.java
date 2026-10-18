package com.farm.saas.modules.crop.dto.response;

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
public class FarmingLogDetailResponse {
    private Long id;
    private Long farmId;
    private Long seasonId;
    private String seasonCode;
    private LocalDate logDate;
    private String stage;
    private String activityType;
    private Integer phiDays;
    private LocalDate phiEndDate;
    private String weatherNotes;
    private Long performedByUserId;
    private String performedByUserName;
    private Boolean isInventoryBackflushed;
    private List<FarmingSupplyDto> supplies;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmingSupplyDto {
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
