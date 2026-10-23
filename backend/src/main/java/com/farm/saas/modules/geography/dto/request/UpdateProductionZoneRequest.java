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

    @jakarta.validation.constraints.Pattern(
            regexp = "^(?i)(GREENHOUSE|OPEN_FIELD|BARN|STORAGE|ISOLATION)$",
            message = "Loại phân khu phải là GREENHOUSE, OPEN_FIELD, BARN, STORAGE hoặc ISOLATION"
    )
    private String zoneType;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.01", message = "Diện tích phân khu phải lớn hơn 0")
    private BigDecimal areaM2;

    private String soilType;
    private String waterSource;
    private String mapLayoutJson;
    private String status;
}
