package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.WarehouseStatus;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

/**
 * DTO trả về thông tin chi tiết Kho bãi cho Client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseResponse {

    @Schema(description = "ID kho", example = "1")
    private Long id;

    @Schema(description = "ID trang trại sở tại", example = "10")
    private Long farmId;

    @Schema(description = "Mã kho", example = "KHO-PB01")
    private String code;

    @Schema(description = "Tên kho", example = "Kho Phân bón & Chế phẩm Vi sinh 01")
    private String name;

    @Schema(description = "Loại kho", example = "FERTILIZER")
    private WarehouseType warehouseType;

    @Schema(description = "Mô tả vị trí", example = "Khu B - Cạnh nhà màng số 2")
    private String locationDesc;

    @Schema(description = "ID người phụ trách kho", example = "5")
    private Long managerUserId;

    @Schema(description = "Trạng thái kho: ACTIVE, INACTIVE, FULL", example = "ACTIVE")
    private WarehouseStatus status;

    @Schema(description = "Thời điểm khởi tạo bản ghi")
    private Instant createdAt;

    @Schema(description = "Thời điểm cập nhật mới nhất")
    private Instant updatedAt;
}
