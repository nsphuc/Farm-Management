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
public class FarmExpenseDetailResponse {

    private Long id;
    private Long farmId;
    private String farmName;
    private Long costCategoryId;
    private String costCategoryName;
    private String costCategoryCode;
    private String costType;
    private String expenseCode;
    private String expenseSource;
    private Long referenceId;
    private Long seasonId;
    private String seasonCode;
    private Long livestockGroupId;
    private String groupCode;
    private LocalDate expenseDate;
    private BigDecimal amount;
    private Boolean unitCostEligible;
    private String paymentMethod;
    private String recipientName;
    private String receiptPhotoUrl;
    private String notes;
    private String status;
    private BigDecimal totalAllocatedAmount;
    private List<CostAllocationDto> allocations;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostAllocationDto {
        private Long id;
        private String targetType;
        private Long targetId;
        private String targetName;
        private BigDecimal allocatedAmount;
    }
}
