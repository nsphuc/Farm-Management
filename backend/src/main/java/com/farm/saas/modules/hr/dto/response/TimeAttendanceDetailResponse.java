package com.farm.saas.modules.hr.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeAttendanceDetailResponse {
    private Long id;
    private Long employeeId;
    private String employeeFullName;
    private String employeeCode;
    private Long farmId;
    private String farmName;
    private Long shiftId;
    private String shiftName;
    private LocalDate workDate;
    private Instant checkInTime;
    private Instant checkOutTime;
    private BigDecimal gpsLatitude;
    private BigDecimal gpsLongitude;
    private BigDecimal gpsDistanceM;
    private BigDecimal checkOutLatitude;
    private BigDecimal checkOutLongitude;
    private BigDecimal checkOutDistanceM;
    private String checkInPhotoUrl;
    private String checkOutPhotoUrl;
    private BigDecimal workingHours;
    private Integer lateMinutes;
    private Integer earlyLeaveMinutes;
    private String deviceInfo;
    private String status;
    private String notes;
    @JsonProperty("isAdjusted")
    private Boolean isAdjusted;
    private Long adjustedByUserId;
    private String adjustedByName;
    private String adjustmentReason;
    private Instant originalCheckIn;
    private Instant originalCheckOut;
    private Instant createdAt;
    private Instant updatedAt;
}
