package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationResponse {

    private Long paymentId;
    private String paymentCode;
    private BigDecimal totalAmount;
    private BigDecimal allocatedAmount;
    private String status;
    private DebtUpdateDto debtUpdate;
    private SalesOrderUpdateDto salesOrderUpdate;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebtUpdateDto {
        private Long debtRecordId;
        private Long salesOrderId;
        private String orderCode;
        private BigDecimal totalDebt;
        private BigDecimal paidAmount;
        private BigDecimal remainingDebt;
        private String status;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesOrderUpdateDto {
        private Long orderId;
        private BigDecimal finalAmount;
        private BigDecimal paidAmount;
        private BigDecimal debtAmount;
        private String paymentStatus;
    }
}
