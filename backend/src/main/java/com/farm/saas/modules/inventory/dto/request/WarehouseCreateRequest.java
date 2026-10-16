package com.farm.saas.modules.inventory.dto.request;

import com.farm.saas.modules.inventory.entity.WarehouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu tạo mới Kho bãi.
 * Tuyệt đối không chứa tenantId (Backend tự trích xuất từ Token).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseCreateRequest {

    @NotBlank(message = "Mã kho không được để trống")
    @Size(max = 50, message = "Mã kho không được vượt quá 50 ký tự")
    @Schema(description = "Mã kho duy nhất trong trang trại", example = "KHO-PB01")
    private String code;

    @NotBlank(message = "Tên kho không được để trống")
    @Size(max = 150, message = "Tên kho không được vượt quá 150 ký tự")
    @Schema(description = "Tên kho bãi", example = "Kho Phân bón & Chế phẩm Vi sinh 01")
    private String name;

    @NotNull(message = "Loại kho không được để trống (FERTILIZER, PESTICIDE, ANIMAL_FEED, HARVESTED_PRODUCE, TOOLS_EQUIPMENT, GENERAL)")
    @Schema(description = "Phân loại kho", example = "FERTILIZER")
    private WarehouseType warehouseType;

    @Size(max = 255, message = "Mô tả vị trí không được vượt quá 255 ký tự")
    @Schema(description = "Vị trí địa lý / mô tả vị trí kho", example = "Khu B - Cạnh nhà màng số 2")
    private String locationDesc;

    @Schema(description = "ID người phụ trách kho (User ID)", example = "5")
    private Long managerUserId;
}
