package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.CostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCategoryRequest {

    @NotBlank(message = "Mã danh mục chi phí không được để trống")
    private String code;

    @NotBlank(message = "Tên danh mục chi phí không được để trống")
    private String name;

    @NotNull(message = "Loại chi phí không được để trống")
    private CostType costType;

    private String description;
    private String status;
}
