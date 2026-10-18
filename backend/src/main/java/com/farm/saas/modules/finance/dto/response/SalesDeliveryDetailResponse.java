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
public class SalesDeliveryDetailResponse {

    private Long id;
    private String deliveryCode;
    private Long salesOrderId;
    private String orderCode;
    private Long farmId;
    private String farmName;
    private Long partnerId;
    private String partnerName;
    private LocalDate deliveryDate;
    private Long logisticsPartnerId;
    private String logisticsPartnerName;
    private String driverName;
    private String vehiclePlate;
    private String receiverName;
    private String shippingAddress;
    private String proofOfDeliveryUrl;
    private String status;
    private BigDecimal totalShippedAmount;
    private Long deliveredByUserId;
    private String deliveredByName;
    private String notes;
    private List<SalesDeliveryItemDto> items;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesDeliveryItemDto {
        private Long id;
        private Long salesOrderItemId;
        private Long productBatchId;
        private String batchCode;
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String notes;
    }
}
