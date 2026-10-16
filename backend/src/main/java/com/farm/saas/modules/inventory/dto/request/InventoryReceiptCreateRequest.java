package com.farm.saas.modules.inventory.dto.request;

import com.farm.saas.modules.inventory.entity.ReceiptType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO yêu cầu tạo Phiếu Nhập kho (Nghiệp vụ: 3.3 Nhập kho).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptCreateRequest {

    @NotNull(message = "Kho bãi không được để trống")
    @Schema(description = "ID kho bãi nhập hàng", example = "1")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu nhập không được vượt quá 50 ký tự")
    @Schema(description = "Mã chứng từ nhập kho (Nếu để trống hệ thống sẽ tự sinh)", example = "PNK-20261017-001")
    private String receiptCode;

    @NotNull(message = "Loại nhập kho không được để trống")
    @Schema(description = "Loại nhập kho (PURCHASE, HARVEST_RETURN, INTERNAL_TRANSFER, ADJUSTMENT)", example = "PURCHASE")
    private ReceiptType receiptType;

    @Schema(description = "ID nhà cung cấp / đối tác (Bắt buộc cùng Tenant)", example = "1")
    private Long partnerId;

    @NotNull(message = "Ngày nhập kho không được để trống")
    @Schema(description = "Ngày hạch toán nhập kho", example = "2026-10-17")
    private LocalDate receiptDate;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú phiếu nhập", example = "Nhập kho phân bón đầu vụ đông xuân")
    private String notes;

    @NotEmpty(message = "Danh sách chi tiết nhập kho không được để trống")
    @Valid
    @Schema(description = "Danh sách các mặt hàng nhập kho")
    private List<InventoryReceiptItemRequest> items;
}
