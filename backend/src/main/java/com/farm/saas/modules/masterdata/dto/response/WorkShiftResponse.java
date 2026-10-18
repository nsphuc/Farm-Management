package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkShiftResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String name;
    private String shiftCode;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer breakMinutes;
    private Integer graceLateMinutes;
    private Boolean isOvernight;
    private Instant createdAt;
}
