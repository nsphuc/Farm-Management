package com.farmsaas.modules.hr.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    private Long employeeId; // Nếu không truyền, lấy theo user đang đăng nhập
    private Long shiftId;

    private LocalDate workDate;

    @NotNull(message = "Tọa độ vĩ độ (Latitude) không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Tọa độ kinh độ (Longitude) không được để trống")
    private BigDecimal longitude;

    private String notes;
}
