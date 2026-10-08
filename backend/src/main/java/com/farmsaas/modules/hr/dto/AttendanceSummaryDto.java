package com.farmsaas.modules.hr.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryDto {

    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long totalWorkDays;
    private BigDecimal totalWorkingHours;
    private BigDecimal totalOvertimeHours;
    private Long onTimeCount;
    private Long lateCount;
    private Long earlyLeaveCount;
    private Long outOfRadiusCount;
}
