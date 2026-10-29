package com.farm.saas.modules.crop.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCropSeasonRequest {

    private Long locationId;

    private LocalDate expectedHarvestDate;

    private LocalDate actualHarvestDate;

    @DecimalMin(value = "0.00", message = "Sản lượng thực tế không được âm")
    private BigDecimal actualYieldKg;

    @Pattern(regexp = "^(SOIL_PREPARATION|SOWING|GROWING|HARVESTING|CLOSED|CANCELLED)$",
            message = "Trạng thái vụ mùa không hợp lệ")
    private String status;
}
