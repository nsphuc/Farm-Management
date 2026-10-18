package com.farm.saas.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemResponse {
    private Long id;
    private Long warehouseId;
    private String warehouseName;
    private Long materialId;
    private String skuCode;
    private String materialName;
    private String standardUnit;
    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate inwardDate;
    private LocalDate expiryDate;
    private BigDecimal unitCost;
    private BigDecimal quantityOnHand;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private String storageBinCode;
    private String internalBatchBarcode;
    private Boolean isLowStock;
    private Boolean isNearExpiry;
    private Long daysUntilExpiry;
}
