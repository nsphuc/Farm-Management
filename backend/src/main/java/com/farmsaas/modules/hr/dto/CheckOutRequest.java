package com.farmsaas.modules.hr.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckOutRequest {

    private Long employeeId;

    @NotNull(message = "Tọa độ vĩ độ (Latitude) không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Tọa độ kinh độ (Longitude) không được để trống")
    private BigDecimal longitude;

    private String notes;
}
