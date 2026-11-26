package com.farm.saas.modules.purchase.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceDetailResponse {

    private Long id;
    private Long farmId;
    private Long branchId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private Long supplierId;
    private String supplierName;
    private String invoiceType;
    private String destinationType;
    private String destinationName;
    private Long warehouseId;
    private Long barnId;
    private Long batchId;
    private BigDecimal totalGoodsAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalPaymentAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingDebt;
    private String paymentStatus;
    private String paymentMethod;
    private String creatorName;
    private String approverName;
    private String notes;
    private Instant createdAt;
    private List<ItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private Long materialId;
        private String name;
        private String unit;
        private BigDecimal quantity;
        private String lotCode;
        private LocalDate expiryDate;
        private BigDecimal unitPrice;
        private BigDecimal amount;
    }
}
