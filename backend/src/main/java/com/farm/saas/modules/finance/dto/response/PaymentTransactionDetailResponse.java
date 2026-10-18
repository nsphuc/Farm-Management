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
public class PaymentTransactionDetailResponse {

    private Long id;
    private Long farmId;
    private String farmName;
    private String paymentCode;
    private String paymentType;
    private Long partnerId;
    private String partnerName;
    private Long salesOrderId;
    private String orderCode;
    private Long debtRecordId;
    private BigDecimal amount;
    private BigDecimal allocatedAmount;
    private String paymentMethod;
    private String referenceCode;
    private String qrTransferContent;
    private String proofImageUrl;
    private Long confirmedByUserId;
    private String confirmedByName;
    private Instant confirmedAt;
    private LocalDate paymentDate;
    private String notes;
    private String status;
    private List<PaymentAllocationItemDto> allocations;
    private String creatorFullName;
    private Instant createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentAllocationItemDto {
        private Long id;
        private Long debtRecordId;
        private BigDecimal allocatedAmount;
        private BigDecimal remainingDebtAfter;
        private String notes;
        private Instant allocatedAt;
    }
}
