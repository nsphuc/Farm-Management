package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.LivestockBreed;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockBreedResponse {

    private Long id;
    private Long tenantId;
    private LivestockSpecies species;
    private String breedName;
    private Integer standardGrowthDays;
    private BigDecimal targetWeightKg;
    private Instant createdAt;
    private Instant updatedAt;

    public static LivestockBreedResponse fromEntity(LivestockBreed entity) {
        if (entity == null) return null;
        return LivestockBreedResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .species(entity.getSpecies())
                .breedName(entity.getBreedName())
                .standardGrowthDays(entity.getStandardGrowthDays())
                .targetWeightKg(entity.getTargetWeightKg())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
