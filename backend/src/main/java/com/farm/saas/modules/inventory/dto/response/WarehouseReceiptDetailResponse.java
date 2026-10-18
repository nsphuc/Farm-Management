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
public class WarehouseReceiptDetailResponse {
    private Long id;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String receiptCode;
    private String receiptType;
    private Long partnerId;
    private String partnerName;
    private LocalDate receiptDate;
    private BigDecimal totalAmount;
    private String notes;
    private String status;
    private Long approvedBy;
    private Instant approvedAt;
    private Long cancelledBy;
    private Instant cancelledAt;
    private String cancellationReason;
    private List<ReceiptItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItemDto {
        private Long id;
        private Long materialId;
        private String skuCode;
        private String materialName;
        private String standardUnit;
        private String batchNumber;
        private LocalDate expiryDate;
        private String enteredUnit;
        private BigDecimal enteredQuantity;
        private BigDecimal conversionFactor;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String storageBinCode;
    }
}
