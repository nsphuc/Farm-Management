package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
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
public class SalesOrderResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String orderCode;
    private Long partnerId;
    private String partnerName;
    private String partnerPhone;
    private LocalDate orderDate;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal vatAmount;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private PaymentStatus paymentStatus;
    private DeliveryStatus deliveryStatus;
    private String notes;
    private Long createdByUserId;
    private List<SalesOrderItemDto> items;
    private Instant createdAt;
    private Instant updatedAt;
}
