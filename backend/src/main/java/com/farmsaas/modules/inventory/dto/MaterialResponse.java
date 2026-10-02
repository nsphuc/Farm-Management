package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.Material;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponse {

    private Long id;
    private Long tenantId;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String skuCode;
    private String name;
    private StandardUnit standardUnit;
    private Integer expiryAlertDays;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private BigDecimal unitPriceStandard;
    private String activeIngredient;
    private Integer isolationDays;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static MaterialResponse fromEntity(Material entity) {
        if (entity == null) return null;
        return MaterialResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .categoryId(entity.getCategoryId())
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .categoryCode(entity.getCategory() != null ? entity.getCategory().getCode() : null)
                .skuCode(entity.getSkuCode())
                .name(entity.getName())
                .standardUnit(entity.getStandardUnit())
                .expiryAlertDays(entity.getExpiryAlertDays())
                .minStockLevel(entity.getMinStockLevel())
                .maxStockLevel(entity.getMaxStockLevel())
                .unitPriceStandard(entity.getUnitPriceStandard())
                .activeIngredient(entity.getActiveIngredient())
                .isolationDays(entity.getIsolationDays())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
