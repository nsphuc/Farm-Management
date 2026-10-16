package com.farm.saas.modules.inventory.dto.request;

import com.farm.saas.modules.inventory.entity.WarehouseStatus;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu cập nhật thông tin Kho bãi.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseUpdateRequest {

    @NotBlank(message = "Tên kho không được để trống")
    @Size(max = 150, message = "Tên kho không được vượt quá 150 ký tự")
    @Schema(description = "Tên kho bãi", example = "Kho Phân bón & Chế phẩm Vi sinh 01")
    private String name;

    @NotNull(message = "Loại kho không được để trống")
    @Schema(description = "Phân loại kho", example = "FERTILIZER")
    private WarehouseType warehouseType;

    @Size(max = 255, message = "Mô tả vị trí không được vượt quá 255 ký tự")
    @Schema(description = "Vị trí địa lý / mô tả vị trí kho", example = "Khu B - Cạnh nhà màng số 2")
    private String locationDesc;

    @Schema(description = "ID người phụ trách kho (User ID)", example = "5")
    private Long managerUserId;

    @NotNull(message = "Trạng thái kho không được để trống")
    @Schema(description = "Trạng thái hoạt động: ACTIVE, INACTIVE, FULL", example = "ACTIVE")
    private WarehouseStatus status;
}
