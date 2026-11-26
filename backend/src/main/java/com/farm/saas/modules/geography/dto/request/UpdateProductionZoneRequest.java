package com.farm.saas.modules.geography.dto.request;

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
public class UpdateProductionZoneRequest {

    @NotBlank(message = "Tên phân khu không được để trống")
    private String name;

    private String zoneType;

    private BigDecimal areaM2;

    private String soilType;
    private String waterSource;
    private String mapLayoutJson;
    private String status;
}
