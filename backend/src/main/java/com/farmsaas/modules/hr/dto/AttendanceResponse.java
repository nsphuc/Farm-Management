package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long shiftId;
    private String shiftName;
    private LocalDate workDate;
    private LocalDateTime checkInTime;
    private BigDecimal checkInLatitude;
    private BigDecimal checkInLongitude;
    private BigDecimal checkInDistanceM;
    private LocalDateTime checkOutTime;
    private BigDecimal checkOutLatitude;
    private BigDecimal checkOutLongitude;
    private BigDecimal checkOutDistanceM;
    private AttendanceStatus status;
    private BigDecimal workingHours;
    private BigDecimal overtimeHours;
    private String notes;
    private java.time.Instant createdAt;
}
