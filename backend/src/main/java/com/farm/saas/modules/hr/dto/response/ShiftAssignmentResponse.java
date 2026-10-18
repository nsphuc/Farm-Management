package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftAssignmentResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private Long shiftId;
    private String shiftName;
    private String shiftCode;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate workDate;
    private String status;
    private Instant createdAt;
}
