package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckOutAttendanceRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    private Long employeeId;

    @NotNull(message = "Ca làm việc không được để trống")
    private Long shiftId;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String photoUrl;

    private Instant checkOutTime;
    private String notes;
}
