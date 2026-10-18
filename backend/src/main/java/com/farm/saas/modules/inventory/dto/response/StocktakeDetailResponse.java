package com.farm.saas.modules.inventory.dto.response;

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
public class StocktakeDetailResponse {
    private Long id;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String stocktakeCode;
    private LocalDate stocktakeDate;
    private String status;
    private Long approvedBy;
    private Instant approvedAt;
    private String notes;
    private List<StocktakeItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StocktakeItemDto {
        private Long id;
        private Long materialId;
        private String skuCode;
        private String materialName;
        private String standardUnit;
        private String batchNumber;
        private BigDecimal bookQuantity;
        private BigDecimal actualQuantity;
        private BigDecimal differenceQuantity;
        private String reason;
    }
}
