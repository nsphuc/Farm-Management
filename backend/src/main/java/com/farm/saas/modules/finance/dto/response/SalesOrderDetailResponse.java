package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderDetailResponse {

    private Long id;
    private String orderCode;
    private LocalDate orderDate;
    private Long farmId;
    private String farmName;
    private Long partnerId;
    private String partnerCode;
    private String partnerName;
    private BigDecimal partnerCreditLimit;
    private BigDecimal partnerCurrentDebt;
    private Integer paymentTermDays;
    private LocalDate dueDate;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal debtAmount;
    private String status;
    private String deliveryStatus;
    private String paymentStatus;
    private String vietQrUrl;
    private List<SalesOrderItemDto> items;
    private String creatorFullName;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesOrderItemDto {
        private Long id;
        private Long productBatchId;
        private String batchCode;
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal shippedQuantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal discountAmount;
        private BigDecimal vatAmount;
        private BigDecimal finalAmount;
        private BigDecimal totalPrice;
    }
}
