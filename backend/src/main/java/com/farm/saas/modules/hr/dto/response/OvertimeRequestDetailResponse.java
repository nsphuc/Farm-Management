package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequestDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private Long shiftId;
    private String shiftName;
    private LocalDate otDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal totalHours;
    private BigDecimal otMultiplier;
    private String reason;
    private String status;
    private Long approvedByUserId;
    private String approverName;
    private Instant approvedAt;
    private String rejectionReason;
    private Instant createdAt;
    private Instant updatedAt;
}
