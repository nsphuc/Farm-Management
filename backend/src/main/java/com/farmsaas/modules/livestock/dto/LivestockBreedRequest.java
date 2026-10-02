package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
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
public class LivestockBreedRequest {

    @NotNull(message = "Loài vật nuôi không được để trống.")
    private LivestockSpecies species;

    @NotBlank(message = "Tên giống không được để trống.")
    @Size(max = 150, message = "Tên giống tối đa 150 ký tự.")
    private String breedName;

    @NotNull(message = "Số ngày sinh trưởng tiêu chuẩn không được để trống.")
    @Positive(message = "Số ngày sinh trưởng phải lớn hơn 0.")
    private Integer standardGrowthDays;

    private BigDecimal targetWeightKg;
}
