package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtRecordDetailResponse {

    private Long id;
    private Long farmId;
    private String farmName;
    private Long partnerId;
    private String partnerCode;
    private String partnerName;
    private Long salesOrderId;
    private String orderCode;
    private Long warehouseReceiptId;
    private String receiptCode;
    private String debtType;
    private BigDecimal totalDebt;
    private BigDecimal paidAmount;
    private BigDecimal remainingDebt;
    private LocalDate dueDate;
    private Long daysOverdue;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
