package com.farm.saas.modules.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO yêu cầu dòng hàng chi tiết nhập kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptItemRequest {

    @NotNull(message = "Mã vật tư không được để trống")
    @Schema(description = "ID vật tư", example = "1")
    private Long materialId;

    @NotBlank(message = "Số lô không được để trống")
    @Size(max = 50, message = "Số lô không được vượt quá 50 ký tự")
    @Schema(description = "Số lô sản xuất / nhập kho", example = "BATCH-202610-01")
    private String batchNumber;

    @Schema(description = "Hạn sử dụng của lô (phục vụ FEFO)", example = "2027-10-17")
    private LocalDate expiryDate;

    @NotNull(message = "Số lượng nhập kho không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng nhập kho phải lớn hơn 0")
    @Schema(description = "Số lượng nhập", example = "100.00")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
    @Schema(description = "Đơn giá nhập kho", example = "25000.00")
    private BigDecimal unitPrice;

    @Size(max = 50, message = "Mã vị trí lưu trữ không được vượt quá 50 ký tự")
    @Schema(description = "Vị trí kệ/ngăn lưu trữ", example = "KE-A1")
    private String storageBinCode;
}
