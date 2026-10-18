package com.farm.saas.modules.livestock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeightLogDetailResponse {
    private Long id;
    private Long farmId;
    private String targetType;
    private Long individualId;
    private String rfidTagCode;
    private Long groupId;
    private String groupCode;
    private LocalDate recordDate;
    private BigDecimal weightKg;
    private BigDecimal previousWeightKg;
    private Long daysBetween;
    private BigDecimal adgKgPerDay;
    private Long recordedByUserId;
    private String recordedByUserName;
    private String notes;
    private Instant createdAt;
}
