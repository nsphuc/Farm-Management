package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBudgetRequest {

    @NotBlank(message = "Tên kế hoạch ngân sách không được để trống")
    private String name;

    @NotNull(message = "Năm tài chính không được để trống")
    private Integer fiscalYear;

    private Long operationalCycleId;

    @NotNull(message = "Tổng ngân sách không được để trống")
    @DecimalMin(value = "0.00", message = "Tổng ngân sách không được âm")
    private BigDecimal totalBudgetAmount;

    @Valid
    private List<BudgetItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetItemRequest {

        @NotNull(message = "Khoản mục chi phí không được để trống")
        private Long costCategoryId;

        @NotNull(message = "Hạn mức phân bổ không được để trống")
        @DecimalMin(value = "0.00", message = "Hạn mức phân bổ không được âm")
        private BigDecimal allocatedAmount;

        private String notes;
    }
}
