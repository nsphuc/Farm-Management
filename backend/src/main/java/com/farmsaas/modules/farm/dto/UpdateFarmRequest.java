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
public class UpdateFarmRequest {

    @NotBlank(message = "Tên trang trại không được để trống")
    @Size(max = 255, message = "Tên trang trại tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại hình trang trại không được để trống")
    private String farmType;

    @NotNull(message = "Tổng diện tích không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal totalAreaM2;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @NotBlank(message = "Địa chỉ trang trại không được để trống")
    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    private Long managerUserId;

    private String status;
}
