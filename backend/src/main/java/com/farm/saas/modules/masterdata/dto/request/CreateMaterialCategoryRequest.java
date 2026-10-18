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
public class CreateMaterialCategoryRequest {

    @NotBlank(message = "Mã nhóm vật tư không được để trống")
    private String code;

    @NotBlank(message = "Tên nhóm vật tư không được để trống")
    private String name;

    private String description;
}
