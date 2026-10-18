package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private String reason;
    private String status;
    private Long approvedByUserId;
    private String approverName;
    private Instant approvedAt;
    private String rejectionReason;
    private Instant createdAt;
    private Instant updatedAt;
}
