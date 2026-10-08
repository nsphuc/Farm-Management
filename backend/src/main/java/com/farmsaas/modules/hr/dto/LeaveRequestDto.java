package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.LeaveType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDto {

    private Long employeeId;

    @NotNull(message = "Loại nghỉ phép không được để trống")
    private LeaveType leaveType;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    @NotNull(message = "Tổng số ngày nghỉ không được để trống")
    private BigDecimal totalDays;

    private String reason;
}
