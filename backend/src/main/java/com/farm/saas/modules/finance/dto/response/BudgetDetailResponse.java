package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDetailResponse {

    private Long id;
    private Long farmId;
    private String farmName;
    private Long operationalCycleId;
    private String name;
    private Integer fiscalYear;
    private BigDecimal totalBudgetAmount;
    private BigDecimal totalSpentAmount;
    private String status;
    private List<BudgetLineItemDto> lineItems;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetLineItemDto {
        private Long id;
        private Long costCategoryId;
        private String costCategoryName;
        private String costCategoryCode;
        private String costType;
        private BigDecimal allocatedAmount;
        private BigDecimal spentAmount;
        private Double usagePercentage;
        private String notes;
    }
}
