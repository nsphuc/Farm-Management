package com.farmsaas.modules.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRequest {

    private Long seasonId;
    private String budgetCode;

    @NotBlank(message = "Tiêu đề ngân sách không được để trống")
    private String title;

    private String status;
    private String notes;

    @NotEmpty(message = "Danh sách hạng mục ngân sách không được để trống")
    private List<BudgetLineItemDto> items;
}
