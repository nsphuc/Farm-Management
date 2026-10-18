package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class CreateUnitConversionRequest {

    @NotBlank(message = "Tên đơn vị quy đổi không được để trống")
    private String unitName;

    private String unitBarcode;

    @NotNull(message = "Hệ số quy đổi không được để trống")
    @DecimalMin(value = "0.0001", message = "Hệ số quy đổi phải lớn hơn 0")
    private BigDecimal conversionFactor;

    @Builder.Default
    private Boolean isPurchaseUnit = true;

    @Builder.Default
    private Boolean isDispatchUnit = false;
}
