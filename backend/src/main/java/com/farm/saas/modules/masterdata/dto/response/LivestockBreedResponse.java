package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockBreedResponse {

    private Long id;
    private Long tenantId;
    private String species;
    private String breedName;
    private Integer standardGrowthDays;
    private BigDecimal targetWeightKg;
    private Instant createdAt;
}
