package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseRequest {

    @NotBlank(message = "Mã kho không được để trống")
    private String code;

    @NotBlank(message = "Tên kho không được để trống")
    private String name;

    @NotBlank(message = "Loại kho không được để trống")
    private String warehouseType;

    private BigDecimal capacityM3;
    private BigDecimal floorAreaM2;
    private BigDecimal standardTempC;

    @DecimalMin(value = "0.00", message = "Độ ẩm tiêu chuẩn phải từ 0% đến 100%")
    @DecimalMax(value = "100.00", message = "Độ ẩm tiêu chuẩn phải từ 0% đến 100%")
    private BigDecimal standardHumidityPct;

    private String locationDesc;
    private Long managerUserId;
}
