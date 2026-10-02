package com.farmsaas.modules.crop.dto;

import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropSeasonRequest {

    @NotNull(message = "Phân khu sản xuất không được để trống.")
    private Long zoneId;

    @Size(max = 50, message = "Mã vụ mùa tối đa 50 ký tự.")
    private String seasonCode; // nếu null, hệ thống tự sinh VU-yyyyMMdd-XXXX

    @NotNull(message = "Giống cây trồng không được để trống.")
    private Long cropTypeId;

    @NotNull(message = "Ngày bắt đầu gieo trồng không được để trống.")
    private LocalDate startDate;

    @NotNull(message = "Ngày dự kiến thu hoạch không được để trống.")
    private LocalDate expectedHarvestDate;

    @NotNull(message = "Diện tích gieo trồng (m2) không được để trống.")
    @Positive(message = "Diện tích gieo trồng phải lớn hơn 0.")
    private BigDecimal plantedAreaM2;

    private BigDecimal seedQuantity;
    private BigDecimal estimatedYieldKg;
    private SeasonStatus status;
}
