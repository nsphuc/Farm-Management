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
public class LivestockGroupDetailResponse {
    private Long id;
    private Long farmId;
    private Long zoneId;
    private String zoneName;
    private Long locationId;
    private String locationName;
    private Long operationalCycleId;
    private String cycleName;
    private String groupCode;
    private Long breedId;
    private String breedName;
    private Long partnerId;
    private String partnerName;
    private Integer initialQuantity;
    private Integer currentQuantity;
    private BigDecimal unitPrice;
    private BigDecimal totalCost;
    private BigDecimal avgInitialWeightKg;
    private String healthCertificate;
    private String origin;
    private String notes;
    private LocalDate entryDate;
    private String status;
    private String managementType;
    private Integer taggedIndividualCount;
    private LocalDate activeWithdrawalEndDate;
    private Boolean isInWithdrawalQuarantine;
    private BigDecimal totalExpensesAmount;
    private Long createdBy;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
}
