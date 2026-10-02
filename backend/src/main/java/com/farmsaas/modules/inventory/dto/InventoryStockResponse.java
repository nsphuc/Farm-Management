package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.WarehouseInventory;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStockResponse {

    private Long id;
    private Long warehouseId;
    private String warehouseName;
    private Long materialId;
    private String materialSku;
    private String materialName;
    private StandardUnit standardUnit;
    private String batchNumber;
    private LocalDate expiryDate;
    private Long daysUntilExpiry;
    private boolean isExpired;
    private boolean isNearExpiry;
    private BigDecimal quantityOnHand;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private String storageBinCode;
    private BigDecimal minStockLevel;
    private boolean isLowStock;

    public static InventoryStockResponse fromEntity(WarehouseInventory entity) {
        if (entity == null) return null;

        Long daysLeft = null;
        boolean expired = false;
        boolean nearExpiry = false;

        if (entity.getExpiryDate() != null) {
            LocalDate today = LocalDate.now();
            daysLeft = ChronoUnit.DAYS.between(today, entity.getExpiryDate());
            if (daysLeft < 0) {
                expired = true;
            } else if (daysLeft <= 30) {
                nearExpiry = true;
            }
        }

        BigDecimal minStock = entity.getMaterial() != null ? entity.getMaterial().getMinStockLevel() : BigDecimal.ZERO;
        BigDecimal avail = entity.getAvailableQuantity();
        boolean lowStock = minStock != null && avail.compareTo(minStock) < 0;

        return InventoryStockResponse.builder()
                .id(entity.getId())
                .warehouseId(entity.getWarehouseId())
                .warehouseName(entity.getWarehouse() != null ? entity.getWarehouse().getName() : null)
                .materialId(entity.getMaterialId())
                .materialSku(entity.getMaterial() != null ? entity.getMaterial().getSkuCode() : null)
                .materialName(entity.getMaterial() != null ? entity.getMaterial().getName() : null)
                .standardUnit(entity.getMaterial() != null ? entity.getMaterial().getStandardUnit() : null)
                .batchNumber(entity.getBatchNumber())
                .expiryDate(entity.getExpiryDate())
                .daysUntilExpiry(daysLeft)
                .isExpired(expired)
                .isNearExpiry(nearExpiry)
                .quantityOnHand(entity.getQuantityOnHand())
                .reservedQuantity(entity.getReservedQuantity())
                .availableQuantity(avail)
                .storageBinCode(entity.getStorageBinCode())
                .minStockLevel(minStock)
                .isLowStock(lowStock)
                .build();
    }
}
