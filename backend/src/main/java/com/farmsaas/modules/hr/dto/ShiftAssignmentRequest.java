package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.AssignmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftAssignmentRequest {

    @NotNull(message = "Nhân viên không được để trống")
    private Long employeeId;

    @NotNull(message = "Ca làm việc không được để trống")
    private Long shiftId;

    @NotNull(message = "Ngày phân ca không được để trống")
    private LocalDate assignedDate;

    private AssignmentStatus status;
    private String note;

    // Hỗ trợ phân ca hàng loạt (Batch assignment)
    private List<LocalDate> batchDates;
    private List<Long> batchEmployeeIds;
}
