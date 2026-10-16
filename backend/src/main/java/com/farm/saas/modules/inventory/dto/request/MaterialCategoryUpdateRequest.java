package com.farm.saas.modules.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu cập nhật tên Nhóm vật tư.
 * Không cho phép đổi mã code để đảm bảo tính nhất quán của danh mục.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialCategoryUpdateRequest {

    @NotBlank(message = "Tên nhóm vật tư không được để trống")
    @Size(max = 150, message = "Tên nhóm vật tư không được vượt quá 150 ký tự")
    @Schema(description = "Tên nhóm vật tư", example = "Phân bón & Dinh dưỡng cây trồng")
    private String name;
}
