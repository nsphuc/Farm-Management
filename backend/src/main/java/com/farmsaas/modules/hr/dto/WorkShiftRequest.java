package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.ShiftStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkShiftRequest {

    @NotBlank(message = "Mã ca làm việc không được để trống")
    private String shiftCode;

    @NotBlank(message = "Tên ca làm việc không được để trống")
    private String shiftName;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    private Integer breakMinutes;
    private BigDecimal workingHours;
    private Integer lateGraceMinutes;
    private Integer earlyLeaveGraceMinutes;
    private ShiftStatus status;
    private Boolean isOvernight;
}
