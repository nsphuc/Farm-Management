package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.ShiftStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkShiftResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String shiftCode;
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer breakMinutes;
    private BigDecimal workingHours;
    private Integer lateGraceMinutes;
    private Integer earlyLeaveGraceMinutes;
    private ShiftStatus status;
    private Boolean isOvernight;
    private java.time.Instant createdAt;
    private java.time.Instant updatedAt;
}
