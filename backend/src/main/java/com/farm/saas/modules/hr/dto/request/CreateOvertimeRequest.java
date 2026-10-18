package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class CreateOvertimeRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    private Long employeeId;

    private Long shiftId;

    @NotNull(message = "Ngày làm thêm không được để trống")
    private LocalDate otDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    @NotNull(message = "Tổng số giờ làm thêm không được để trống")
    @DecimalMin(value = "0.25", message = "Số giờ làm thêm tối thiểu là 0.25")
    private BigDecimal totalHours;

    @DecimalMin(value = "1.00", message = "Hệ số tăng ca tối thiểu là 1.00")
    private BigDecimal otMultiplier;

    @NotBlank(message = "Lý do làm thêm không được để trống")
    private String reason;
}
