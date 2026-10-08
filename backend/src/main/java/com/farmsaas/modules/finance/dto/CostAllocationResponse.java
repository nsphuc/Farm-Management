package com.farmsaas.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAllocationResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long expenseId;
    private String expenseCode;
    private BigDecimal expenseAmount;
    private Long zoneId;
    private String zoneName;
    private Long seasonId;
    private String seasonCode;
    private BigDecimal allocationRatio;
    private BigDecimal allocatedAmount;
    private String notes;
    private Instant createdAt;
}
