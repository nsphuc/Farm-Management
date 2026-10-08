package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.AssignmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftAssignmentResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long shiftId;
    private String shiftCode;
    private String shiftName;
    private String startTime;
    private String endTime;
    private LocalDate assignedDate;
    private AssignmentStatus status;
    private String note;
    private java.time.Instant createdAt;
}
