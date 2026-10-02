package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialRequest {

    @NotNull(message = "Nhóm vật tư không được để trống.")
    private Long categoryId;

    @NotBlank(message = "Mã SKU không được để trống.")
    @Size(max = 50, message = "Mã SKU tối đa 50 ký tự.")
    private String skuCode;

    @NotBlank(message = "Tên vật tư không được để trống.")
    @Size(max = 255, message = "Tên vật tư tối đa 255 ký tự.")
    private String name;

    @NotNull(message = "Đơn vị tính chuẩn không được để trống.")
    private StandardUnit standardUnit;

    @Builder.Default
    @NotNull(message = "Số ngày cảnh báo hết hạn không được để trống.")
    @PositiveOrZero(message = "Số ngày cảnh báo hết hạn phải >= 0.")
    private Integer expiryAlertDays = 30;

    @Builder.Default
    @NotNull(message = "Mức tồn tối thiểu không được để trống.")
    @PositiveOrZero(message = "Mức tồn tối thiểu phải >= 0.")
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @PositiveOrZero(message = "Mức tồn tối đa phải >= 0.")
    private BigDecimal maxStockLevel;

    @Builder.Default
    @NotNull(message = "Đơn giá chuẩn không được để trống.")
    @PositiveOrZero(message = "Đơn giá chuẩn phải >= 0.")
    private BigDecimal unitPriceStandard = BigDecimal.ZERO;

    @Size(max = 255, message = "Hoạt chất tối đa 255 ký tự.")
    private String activeIngredient;

    @Builder.Default
    @PositiveOrZero(message = "Thời gian cách ly (PHI) phải >= 0 ngày.")
    private Integer isolationDays = 0;

    private String status;
}
