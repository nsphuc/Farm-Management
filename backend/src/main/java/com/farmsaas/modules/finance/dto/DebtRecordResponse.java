package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtRecordResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long partnerId;
    private String partnerName;
    private String partnerPhone;
    private Long orderId;
    private String orderCode;
    private DebtType debtType;
    private BigDecimal originalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private DebtStatus status;
    private Long daysOverdue; // Số ngày quá hạn (nếu > 0)
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
