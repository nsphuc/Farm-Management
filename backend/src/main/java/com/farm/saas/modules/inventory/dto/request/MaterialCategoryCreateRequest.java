package com.farm.saas.modules.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu tạo mới Nhóm vật tư.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialCategoryCreateRequest {

    @NotBlank(message = "Mã nhóm vật tư không được để trống")
    @Size(max = 50, message = "Mã nhóm vật tư không được vượt quá 50 ký tự")
    @Schema(description = "Mã nhóm vật tư duy nhất trong Tenant", example = "PHAN_BON")
    private String code;

    @NotBlank(message = "Tên nhóm vật tư không được để trống")
    @Size(max = 150, message = "Tên nhóm vật tư không được vượt quá 150 ký tự")
    @Schema(description = "Tên nhóm vật tư", example = "Phân bón & Dinh dưỡng cây trồng")
    private String name;
}
