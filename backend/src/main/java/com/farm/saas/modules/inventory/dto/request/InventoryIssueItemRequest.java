package com.farm.saas.modules.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO yêu cầu dòng hàng chi tiết xuất kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssueItemRequest {

    @NotNull(message = "Mã vật tư không được để trống")
    @Schema(description = "ID vật tư", example = "1")
    private Long materialId;

    @NotBlank(message = "Số lô không được để trống")
    @Size(max = 50, message = "Số lô không được vượt quá 50 ký tự")
    @Schema(description = "Số lô hàng cần xuất", example = "BATCH-202610-01")
    private String batchNumber;

    @NotNull(message = "Số lượng xuất kho không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng xuất kho phải lớn hơn 0")
    @Schema(description = "Số lượng xuất", example = "20.00")
    private BigDecimal quantity;

    @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
    @Schema(description = "Đơn giá xuất kho (Nếu để trống hệ thống sẽ tự lấy đơn giá vốn tồn kho)", example = "25000.00")
    private BigDecimal unitPrice;
}
