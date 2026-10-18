package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    private Long employeeId;

    @NotBlank(message = "Loại nghỉ phép không được để trống")
    @Pattern(regexp = "ANNUAL_LEAVE|SICK_LEAVE|UNPAID_LEAVE|MATERNITY_LEAVE|BEREAVEMENT_LEAVE", message = "leaveType phải là ANNUAL_LEAVE, SICK_LEAVE, UNPAID_LEAVE, MATERNITY_LEAVE hoặc BEREAVEMENT_LEAVE")
    private String leaveType;

    @NotNull(message = "Ngày bắt đầu nghỉ không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc nghỉ không được để trống")
    private LocalDate endDate;

    @NotNull(message = "Tổng số ngày nghỉ không được để trống")
    @DecimalMin(value = "0.5", message = "Số ngày nghỉ tối thiểu là 0.5")
    private BigDecimal totalDays;

    @NotBlank(message = "Lý do xin nghỉ không được để trống")
    private String reason;
}
