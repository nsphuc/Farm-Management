package com.farmsaas.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportDTO {
    private BigDecimal totalInventoryValue;
    private Long totalMaterialsCount;
    private Long lowStockCount;
    private Long expiringCount;

    private List<CategoryValuationDTO> categoryValuations;
    private List<ExpiringItemDTO> expiringItems;
    private List<LowStockItemDTO> lowStockItems;
    private List<MaterialConsumptionDTO> consumptions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryValuationDTO {
        private Long categoryId;
        private String categoryName;
        private Long totalItems;
        private BigDecimal totalValue;
        private BigDecimal valuePercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringItemDTO {
        private Long inventoryId;
        private String warehouseName;
        private String materialName;
        private String skuCode;
        private String batchNumber;
        private LocalDate expiryDate;
        private Long daysRemaining;
        private BigDecimal quantityOnHand;
        private String unit;
        private String riskLevel; // CRITICAL (<7 days), WARNING (<30 days), NORMAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockItemDTO {
        private Long materialId;
        private String materialName;
        private String skuCode;
        private String warehouseName;
        private BigDecimal currentStock;
        private BigDecimal minStockLevel;
        private BigDecimal deficit;
        private String unit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialConsumptionDTO {
        private String materialName;
        private String standardUnit;
        private BigDecimal actualConsumed;
        private BigDecimal standardQuota;
        private BigDecimal variancePercentage;
        private String status; // NORMAL, OVERCONSUMED, UNDERCONSUMED
    }
}
