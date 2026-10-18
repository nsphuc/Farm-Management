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
public class LivestockIndividualDetailResponse {
    private Long id;
    private Long farmId;
    private Long zoneId;
    private String zoneName;
    private Long groupId;
    private String groupCode;
    private String rfidTagCode;
    private String gender;
    private LocalDate birthDate;
    private String motherTagCode;
    private String fatherTagCode;
    private BigDecimal currentWeightKg;
    private String healthStatus;
    private BigDecimal latestAdgKgPerDay;
    private LocalDate activeWithdrawalEndDate;
    private Boolean isInWithdrawalQuarantine;
    private Instant createdAt;
    private Instant updatedAt;
}
