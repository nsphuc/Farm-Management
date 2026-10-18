package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCropTypeRequest {

    @NotBlank(message = "Tên loại cây trồng không được để trống")
    private String name;

    @NotBlank(message = "Mã giống cây không được để trống")
    private String varietyCode;

    @NotNull(message = "Số ngày sinh trưởng tiêu chuẩn không được để trống")
    @Min(value = 1, message = "Số ngày sinh trưởng phải lớn hơn 0")
    private Integer growthDaysStandard;

    @DecimalMin(value = "0.00", message = "Nhu cầu nước phải lớn hơn hoặc bằng 0")
    private BigDecimal waterNeedM3Day;

    private BigDecimal optimalTempMin;
    private BigDecimal optimalTempMax;
}
