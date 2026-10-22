package com.farm.saas.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventorySummaryResponse {
    private BigDecimal totalInventoryValuation;
    private BigDecimal totalPurchasedAmount;
    private Long nearExpiryCount;
    private Long lowStockCount;
}
