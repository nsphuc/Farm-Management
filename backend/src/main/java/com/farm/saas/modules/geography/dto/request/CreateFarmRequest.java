package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class CreateFarmRequest {

    private String code;

    @NotBlank(message = "Tên trang trại không được để trống")
    private String name;

    @NotBlank(message = "Loại hình trang trại không được để trống")
    @jakarta.validation.constraints.Pattern(
            regexp = "^(?i)(CROP|LIVESTOCK|MIXED)$",
            message = "Loại hình trang trại phải là CROP, LIVESTOCK hoặc MIXED"
    )
    private String farmType;

    @NotNull(message = "Tổng diện tích không được để trống")
    @DecimalMin(value = "0.00", message = "Tổng diện tích phải lớn hơn hoặc bằng 0")
    private BigDecimal totalAreaM2;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @NotNull(message = "Bán kính chấm công không được để trống")
    @Min(value = 1, message = "Bán kính chấm công phải lớn hơn 0")
    private Integer geofenceRadiusM;

    private String address;
    private Long managerUserId;
}
