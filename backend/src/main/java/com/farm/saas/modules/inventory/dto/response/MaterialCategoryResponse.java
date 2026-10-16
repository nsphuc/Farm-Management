package com.farm.saas.modules.inventory.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

/**
 * DTO trả về thông tin Nhóm vật tư.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialCategoryResponse {

    @Schema(description = "ID nhóm vật tư", example = "1")
    private Long id;

    @Schema(description = "Mã nhóm vật tư", example = "PHAN_BON")
    private String code;

    @Schema(description = "Tên nhóm vật tư", example = "Phân bón & Dinh dưỡng cây trồng")
    private String name;

    @Schema(description = "Thời điểm khởi tạo bản ghi")
    private Instant createdAt;

    @Schema(description = "Thời điểm cập nhật mới nhất")
    private Instant updatedAt;
}
