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
public class CheckInAttendanceResponse {
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
    private String checkInPhotoUrl;
    private BigDecimal gpsDistanceM;
    @JsonProperty("isWithinGeofence")
    private boolean isWithinGeofence;
    private Integer lateMinutes;
    private String status;
    private String notes;
}
