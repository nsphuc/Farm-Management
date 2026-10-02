package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.MaterialCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCategoryRequest {

    @NotBlank(message = "Mã nhóm vật tư không được để trống.")
    @Size(max = 50, message = "Mã nhóm vật tư tối đa 50 ký tự.")
    private String code;

    @NotBlank(message = "Tên nhóm vật tư không được để trống.")
    @Size(max = 150, message = "Tên nhóm vật tư tối đa 150 ký tự.")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String description;
}
