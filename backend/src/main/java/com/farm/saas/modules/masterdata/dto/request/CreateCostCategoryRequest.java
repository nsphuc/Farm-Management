package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCostCategoryRequest {

    @NotBlank(message = "Mã nhóm chi phí không được để trống")
    private String code;

    @NotBlank(message = "Tên nhóm chi phí không được để trống")
    private String name;

    @NotBlank(message = "Loại chi phí không được để trống")
    private String costType; // 'MATERIALS', 'DIRECT_LABOR', 'MACHINERY_FUEL', 'DEPRECIATION', 'INDIRECT_OVERHEAD'
}
