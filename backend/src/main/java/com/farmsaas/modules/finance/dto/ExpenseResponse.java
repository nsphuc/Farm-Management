package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private CostType costType;
    private Long seasonId;
    private String seasonCode;
    private Long herdId;
    private String herdCode;
    private String expenseCode;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private LocalDate expenseDate;
    private String invoiceNumber;
    private Long recipientPartnerId;
    private String recipientPartnerName;
    private Long referenceIssueId;
    private String notes;
    private Long createdByUserId;
    private Instant createdAt;
    private Instant updatedAt;
}
