package com.farmsaas.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetLineItemDto {

    private Long id;

    @NotNull(message = "Danh mục chi phí không được để trống")
    private Long categoryId;

    private String categoryCode;
    private String categoryName;

    @NotNull(message = "Số tiền dự toán không được để trống")
    @DecimalMin(value = "0.00", message = "Số tiền không được âm")
    private BigDecimal plannedAmount;

    private String notes;
}
