package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLivestockBreedRequest {

    private String species;

    @NotBlank(message = "Tên giống không được để trống")
    private String breedName;

    @Min(value = 1, message = "Số ngày nuôi chuẩn phải lớn hơn 0")
    private Integer standardGrowthDays;

    @DecimalMin(value = "0.01", message = "Trọng lượng mục tiêu phải lớn hơn 0")
    private BigDecimal targetWeightKg;
}
