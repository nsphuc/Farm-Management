package com.farm.saas.modules.inventory.dto.request;

import com.farm.saas.modules.inventory.entity.DispatchStrategy;
import com.farm.saas.modules.inventory.entity.StandardUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO yêu cầu tạo mới Mặt hàng / Vật tư nông nghiệp.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialCreateRequest {

    @NotNull(message = "ID nhóm vật tư không được để trống")
    @Schema(description = "ID nhóm vật tư (MaterialCategory ID)", example = "1")
    private Long categoryId;

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 50, message = "Mã SKU không được vượt quá 50 ký tự")
    @Schema(description = "Mã SKU định danh vật tư trong Tenant", example = "SKU-NPK-202015")
    private String skuCode;

    @NotBlank(message = "Tên vật tư không được để trống")
    @Size(max = 255, message = "Tên vật tư không được vượt quá 255 ký tự")
    @Schema(description = "Tên mặt hàng vật tư", example = "Phân bón NPK Đầu Trâu 20-20-15")
    private String name;

    @NotNull(message = "Đơn vị chuẩn không được để trống (KG, GRAM, LITER, ML, BAG, BOTTLE, DOSE, PIECE, BOX)")
    @Schema(description = "Đơn vị tính chuẩn hóa", example = "KG")
    private StandardUnit standardUnit;

    @NotNull(message = "Chiến lược xuất kho không được để trống (FIFO hoặc FEFO)")
    @Schema(description = "Chiến lược xuất kho: FIFO (Nhập trước xuất trước), FEFO (Hết hạn trước xuất trước)", example = "FIFO")
    private DispatchStrategy dispatchStrategy;

    @NotNull(message = "Số ngày cảnh báo hạn dùng không được để trống")
    @Min(value = 0, message = "Số ngày cảnh báo hạn dùng phải >= 0")
    @Schema(description = "Số ngày cảnh báo trước khi hết hạn sử dụng", example = "30")
    private Integer expiryAlertDays;

    @NotNull(message = "Mức tồn kho tối thiểu không được để trống")
    @DecimalMin(value = "0.00", message = "Mức tồn kho tối thiểu phải >= 0")
    @Schema(description = "Ngưỡng cảnh báo tồn tối thiểu", example = "50.00")
    private BigDecimal minStockLevel;

    @DecimalMin(value = "0.00", message = "Mức tồn kho tối đa phải >= 0")
    @Schema(description = "Ngưỡng cảnh báo tồn tối đa (tùy chọn)", example = "500.00")
    private BigDecimal maxStockLevel;

    @NotNull(message = "Đơn giá tiêu chuẩn không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá tiêu chuẩn phải >= 0")
    @Schema(description = "Đơn giá tiêu chuẩn chuẩn hóa", example = "25000.00")
    private BigDecimal unitPriceStandard;
}
