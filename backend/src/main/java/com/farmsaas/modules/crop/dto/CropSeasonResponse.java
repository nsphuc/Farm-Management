package com.farmsaas.modules.crop.dto;

import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropSeasonResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private String seasonCode;
    private Long cropTypeId;
    private String cropTypeName;
    private String varietyCode;
    private LocalDate startDate;
    private LocalDate expectedHarvestDate;
    private LocalDate actualHarvestDate;
    private BigDecimal plantedAreaM2;
    private BigDecimal seedQuantity;
    private BigDecimal estimatedYieldKg;
    private BigDecimal actualYieldKg;
    private BigDecimal actualYieldPerM2;
    private BigDecimal yieldAchievementRate;
    private SeasonStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public static CropSeasonResponse fromEntity(CropSeason entity) {
        if (entity == null) return null;
        return CropSeasonResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarm() != null ? entity.getFarm().getName() : null)
                .zoneId(entity.getZoneId())
                .zoneName(entity.getZone() != null ? entity.getZone().getName() : null)
                .seasonCode(entity.getSeasonCode())
                .cropTypeId(entity.getCropTypeId())
                .cropTypeName(entity.getCropType() != null ? entity.getCropType().getName() : null)
                .varietyCode(entity.getCropType() != null ? entity.getCropType().getVarietyCode() : null)
                .startDate(entity.getStartDate())
                .expectedHarvestDate(entity.getExpectedHarvestDate())
                .actualHarvestDate(entity.getActualHarvestDate())
                .plantedAreaM2(entity.getPlantedAreaM2())
                .seedQuantity(entity.getSeedQuantity())
                .estimatedYieldKg(entity.getEstimatedYieldKg())
                .actualYieldKg(entity.getActualYieldKg())
                .actualYieldPerM2(entity.getActualYieldPerM2())
                .yieldAchievementRate(entity.getYieldAchievementRate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
