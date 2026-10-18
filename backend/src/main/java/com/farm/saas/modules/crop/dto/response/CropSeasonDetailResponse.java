package com.farm.saas.modules.crop.dto.response;

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
public class CropSeasonDetailResponse {
    private Long id;
    private Long farmId;
    private Long zoneId;
    private String zoneName;
    private Long operationalCycleId;
    private String cycleName;
    private String seasonCode;
    private Long cropTypeId;
    private String cropTypeName;
    private LocalDate startDate;
    private LocalDate expectedHarvestDate;
    private LocalDate actualHarvestDate;
    private BigDecimal plantedAreaM2;
    private BigDecimal seedQuantity;
    private BigDecimal estimatedYieldKg;
    private BigDecimal actualYieldKg;
    private String status;
    private LocalDate activePhiEndDate;
    private Boolean isInPhiQuarantine;
    private BigDecimal totalExpensesAmount;
    private Instant createdAt;
    private Instant updatedAt;
}
