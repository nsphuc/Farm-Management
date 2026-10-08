package com.farmsaas.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long seasonId;
    private String seasonCode;
    private String budgetCode;
    private String title;
    private BigDecimal totalBudget;
    private String status;
    private String notes;
    private List<BudgetLineItemDto> items;
    private Instant createdAt;
    private Instant updatedAt;
}
