package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignShiftRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    @NotNull(message = "Nhân viên không được để trống")
    private Long employeeId;

    @NotNull(message = "Ca làm việc không được để trống")
    private Long shiftId;

    @NotNull(message = "Ngày làm việc không được để trống")
    private LocalDate workDate;
}
