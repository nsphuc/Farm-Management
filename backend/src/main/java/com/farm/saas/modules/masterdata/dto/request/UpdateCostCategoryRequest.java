package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCostCategoryRequest {

    private Long farmId;

    private List<Long> applicableFarmIds;

    @NotBlank(message = "Tên nhóm chi phí không được để trống")
    private String name;

    @NotBlank(message = "Loại chi phí không được để trống")
    private String costType;

    private String description;
}
