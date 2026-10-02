package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.Stocktake;
import com.farmsaas.modules.inventory.entity.StocktakeItem;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String stocktakeCode;
    private Instant stocktakeDate;
    private StocktakeStatus status;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private Long reconciledByUserId;
    private String reconciledByUserName;
    private Instant reconciledAt;
    private Instant createdAt;
    private Instant updatedAt;
    private List<StocktakeItemResponse> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StocktakeItemResponse {
        private Long id;
        private Long materialId;
        private String materialSku;
        private String materialName;
        private StandardUnit standardUnit;
        private String batchNumber;
        private BigDecimal systemQuantity;
        private BigDecimal actualQuantity;
        private BigDecimal discrepancyQuantity;
        private String reason;

        public static StocktakeItemResponse fromEntity(StocktakeItem entity) {
            if (entity == null) return null;
            return StocktakeItemResponse.builder()
                    .id(entity.getId())
                    .materialId(entity.getMaterialId())
                    .materialSku(entity.getMaterial() != null ? entity.getMaterial().getSkuCode() : null)
                    .materialName(entity.getMaterial() != null ? entity.getMaterial().getName() : null)
                    .standardUnit(entity.getMaterial() != null ? entity.getMaterial().getStandardUnit() : null)
                    .batchNumber(entity.getBatchNumber())
                    .systemQuantity(entity.getSystemQuantity())
                    .actualQuantity(entity.getActualQuantity())
                    .discrepancyQuantity(entity.getDiscrepancyQuantity())
                    .reason(entity.getReason())
                    .build();
        }
    }

    public static StocktakeResponse fromEntity(Stocktake entity) {
        if (entity == null) return null;
        List<StocktakeItemResponse> items = entity.getItems() != null ?
                entity.getItems().stream().map(StocktakeItemResponse::fromEntity).collect(Collectors.toList()) :
                List.of();

        return StocktakeResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .warehouseId(entity.getWarehouseId())
                .warehouseName(entity.getWarehouse() != null ? entity.getWarehouse().getName() : null)
                .stocktakeCode(entity.getStocktakeCode())
                .stocktakeDate(entity.getStocktakeDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByUserName(entity.getCreatedByUser() != null ? entity.getCreatedByUser().getFullName() : null)
                .reconciledByUserId(entity.getReconciledByUserId())
                .reconciledByUserName(entity.getReconciledByUser() != null ? entity.getReconciledByUser().getFullName() : null)
                .reconciledAt(entity.getReconciledAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(items)
                .build();
    }
}
