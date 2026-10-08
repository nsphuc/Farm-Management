package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.RequestStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate overtimeDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal plannedHours;
    private BigDecimal actualHours;
    private String reason;
    private RequestStatus status;
    private Long approvedBy;
    private String approverName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private java.time.Instant createdAt;
}
