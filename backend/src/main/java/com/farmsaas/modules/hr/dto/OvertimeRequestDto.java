package com.farmsaas.modules.hr.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequestDto {

    private Long employeeId;

    @NotNull(message = "Ngày tăng ca không được để trống")
    private LocalDate overtimeDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    @NotNull(message = "Số giờ dự kiến không được để trống")
    private BigDecimal plannedHours;

    private String reason;
}
