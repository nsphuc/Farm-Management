package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.StandardUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO trả về thông tin tồn kho thực tế của một lô vật tư (bảng warehouse_inventory).
 * Nghiệp vụ: 3.7. Theo dõi tồn kho hiện tại (Inventory Balance).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBalanceResponse {

    @Schema(description = "ID bản ghi tồn kho", example = "1")
    private Long id;

    @Schema(description = "ID Tenant", example = "1")
    private Long tenantId;

    @Schema(description = "ID Trang trại", example = "1")
    private Long farmId;

    @Schema(description = "ID Kho bãi", example = "1")
    private Long warehouseId;

    @Schema(description = "Tên kho bãi", example = "Kho Phân bón 01")
    private String warehouseName;

    @Schema(description = "ID Vật tư", example = "1")
    private Long materialId;

    @Schema(description = "Mã SKU vật tư", example = "SKU-NPK-202015")
    private String materialCode;

    @Schema(description = "Tên vật tư", example = "Phân bón NPK 20-20-15")
    private String materialName;

    @Schema(description = "Đơn vị tính", example = "KG")
    private StandardUnit standardUnit;

    @Schema(description = "Tên nhóm danh mục vật tư", example = "Phân bón & Dinh dưỡng cây trồng")
    private String categoryName;

    @Schema(description = "Số lô sản xuất / nhập kho", example = "BATCH-202610-01")
    private String batchNumber;

    @Schema(description = "Ngày nhập kho (FIFO)", example = "2026-10-17")
    private LocalDate inwardDate;

    @Schema(description = "Hạn sử dụng (FEFO)", example = "2027-10-17")
    private LocalDate expiryDate;

    @Schema(description = "Đơn giá vốn bình quân thực tế", example = "25000.00")
    private BigDecimal unitCost;

    @Schema(description = "Số lượng tồn kho thực tế trên thẻ kho", example = "100.00")
    private BigDecimal quantityOnHand;

    @Schema(description = "Số lượng đặt trước / giữ chỗ", example = "0.00")
    private BigDecimal reservedQuantity;

    @Schema(description = "Số lượng khả dụng thực tế để xuất kho", example = "100.00")
    private BigDecimal availableQuantity;

    @Schema(description = "Mã vị trí / kệ / ngăn lưu trữ", example = "KE-A1")
    private String storageBinCode;

    @Schema(description = "Thời điểm cập nhật biến động tồn kho")
    private Instant updatedAt;
}
