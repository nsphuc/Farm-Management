package com.farm.saas.modules.crop.dto.request;

import jakarta.validation.constraints.*;
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
public class CreateCropSeasonRequest {

    @NotNull(message = "Khu sản xuất không được để trống")
    private Long zoneId;

    private Long locationId;

    private Long operationalCycleId;

    @Size(max = 50, message = "Mã vụ mùa tối đa 50 ký tự")
    private String seasonCode;

    @NotNull(message = "Giống cây trồng không được để trống")
    private Long cropTypeId;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    private LocalDate expectedHarvestDate;

    @NotNull(message = "Diện tích canh tác không được để trống")
    @Positive(message = "Diện tích canh tác phải lớn hơn 0")
    private BigDecimal plantedAreaM2;

    @DecimalMin(value = "0.00", message = "Lượng hạt giống không được âm")
    private BigDecimal seedQuantity;

    @DecimalMin(value = "0.00", message = "Sản lượng ước tính không được âm")
    private BigDecimal estimatedYieldKg;
}
