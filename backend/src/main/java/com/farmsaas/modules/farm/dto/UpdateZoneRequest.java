package com.farmsaas.modules.farm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateZoneRequest {

    @NotBlank(message = "Tên phân khu không được để trống")
    @Size(max = 255, message = "Tên phân khu tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại phân khu không được để trống")
    private String zoneType;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal areaM2;

    private String soilType;
    private String waterSource;
    private String status;
    private String notes;
}
