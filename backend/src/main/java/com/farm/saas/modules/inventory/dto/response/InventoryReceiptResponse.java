package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.ReceiptStatus;
import com.farm.saas.modules.inventory.entity.ReceiptType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO trả về thông tin chi tiết Phiếu Nhập kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptResponse {

    @Schema(description = "ID phiếu nhập", example = "1")
    private Long id;

    @Schema(description = "ID Tenant", example = "1")
    private Long tenantId;

    @Schema(description = "ID Trang trại", example = "1")
    private Long farmId;

    @Schema(description = "ID Kho bãi", example = "1")
    private Long warehouseId;

    @Schema(description = "Tên kho bãi", example = "Kho Phân bón 01")
    private String warehouseName;

    @Schema(description = "Mã phiếu nhập", example = "PNK-20261017-001")
    private String receiptCode;

    @Schema(description = "Loại nhập kho", example = "PURCHASE")
    private ReceiptType receiptType;

    @Schema(description = "ID Đối tác / Nhà cung cấp", example = "1")
    private Long partnerId;

    @Schema(description = "Tên Đối tác / Nhà cung cấp", example = "Công ty CP Vật tư Nông nghiệp")
    private String partnerName;

    @Schema(description = "Ngày nhập kho", example = "2026-10-17")
    private LocalDate receiptDate;

    @Schema(description = "Tổng giá trị tiền hàng", example = "2500000.00")
    private BigDecimal totalAmount;

    @Schema(description = "Ghi chú", example = "Nhập kho phân bón đầu vụ")
    private String notes;

    @Schema(description = "Trạng thái phiếu nhập", example = "COMPLETED")
    private ReceiptStatus status;

    @Schema(description = "Danh sách chi tiết hàng nhập")
    private List<InventoryReceiptItemResponse> items;

    @Schema(description = "Thời điểm tạo phiếu")
    private Instant createdAt;

    @Schema(description = "ID người tạo phiếu")
    private Long createdBy;
}
