package com.farm.saas.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {
    private Long id;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private Long materialId;
    private String skuCode;
    private String materialName;
    private String batchNumber;
    private String transactionType;
    private String referenceDocType;
    private Long referenceDocId;
    private Long referenceItemId;
    private String direction;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private LocalDate transactionDate;
    private String notes;
    private Instant createdAt;
    private Long createdBy;
}
