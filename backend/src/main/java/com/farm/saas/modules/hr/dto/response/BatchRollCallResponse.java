package com.farm.saas.modules.hr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRollCallResponse {

    private int totalEmployees;
    private int successCount;
    private String actionType;
    private Long farmId;
    private String farmName;
    private Long shiftId;
    private String shiftName;
    private LocalDate workDate;
    private BigDecimal gpsDistanceM;
    private boolean isWithinGeofence;
    private List<TimeAttendanceDetailResponse> attendances;
}
