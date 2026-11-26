package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProgramRequest {

    @NotBlank(message = "Tên quy trình nuôi không được để trống")
    private String name;

    @NotBlank(message = "Loại vật nuôi không được để trống")
    private String species; // POULTRY, PIG, SWINE, CATTLE, AQUA

    private String livestockTypeName;
    private String breedName;

    @NotNull(message = "Tổng số ngày nuôi không được để trống")
    @Positive(message = "Tổng số ngày nuôi phải lớn hơn 0")
    private Integer totalDays;

    private BigDecimal targetWeightKg;
    private BigDecimal fcrTarget;
    private BigDecimal adgTarget;
    private String description;
}
