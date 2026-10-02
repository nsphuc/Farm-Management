package com.farmsaas.modules.crop.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestSeasonRequest {

    @NotNull(message = "Ngày thu hoạch thực tế không được để trống.")
    private LocalDate actualHarvestDate;

    @NotNull(message = "Sản lượng thu hoạch thực tế (kg) không được để trống.")
    @PositiveOrZero(message = "Sản lượng thu hoạch thực tế phải >= 0.")
    private BigDecimal actualYieldKg;

    @Builder.Default
    private boolean closeSeason = false; // Nếu true: chuyển trạng thái sang DONG_VU
}
