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
public class UpdateConsumptionQuotaRequest {

    private Long cropTypeId;
    private Long livestockBreedId;

    @NotNull(message = "Vật tư không được để trống")
    private Long materialId;

    @NotNull(message = "Định mức tiêu hao tiêu chuẩn không được để trống")
    @DecimalMin(value = "0.01", message = "Định mức tiêu hao phải lớn hơn 0")
    private BigDecimal standardQuantity;

    @NotBlank(message = "Đơn vị tính định mức không được để trống")
    private String unitOfMeasure;

    private String stage;
}
