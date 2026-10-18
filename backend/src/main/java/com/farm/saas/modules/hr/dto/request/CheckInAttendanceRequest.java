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
public class CheckInAttendanceRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    private Long employeeId;

    @NotNull(message = "Ca làm việc không được để trống")
    private Long shiftId;

    @NotNull(message = "Vĩ độ GPS không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Kinh độ GPS không được để trống")
    private BigDecimal longitude;

    @NotBlank(message = "Ảnh selfie chấm công không được để trống")
    private String photoUrl;

    private Instant checkInTime;
    private String deviceInfo;
    private String notes;
}
