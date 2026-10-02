package com.farmsaas.modules.crop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropTypeRequest {

    @NotBlank(message = "Tên giống cây trồng không được để trống.")
    @Size(max = 150, message = "Tên giống cây trồng tối đa 150 ký tự.")
    private String name;

    @NotBlank(message = "Mã giống không được để trống.")
    @Size(max = 50, message = "Mã giống tối đa 50 ký tự.")
    private String varietyCode;

    @Builder.Default
    @NotNull(message = "Số ngày sinh trưởng tiêu chuẩn không được để trống.")
    @Positive(message = "Số ngày sinh trưởng phải lớn hơn 0.")
    private Integer growthDaysStandard = 90;

    private BigDecimal waterNeedM3Day;
    private BigDecimal optimalTempMin;
    private BigDecimal optimalTempMax;
}
