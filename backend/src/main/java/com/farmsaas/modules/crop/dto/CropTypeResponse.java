package com.farmsaas.modules.crop.dto;

import com.farmsaas.modules.crop.entity.CropType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropTypeResponse {

    private Long id;
    private Long tenantId;
    private String name;
    private String varietyCode;
    private Integer growthDaysStandard;
    private BigDecimal waterNeedM3Day;
    private BigDecimal optimalTempMin;
    private BigDecimal optimalTempMax;
    private Instant createdAt;
    private Instant updatedAt;

    public static CropTypeResponse fromEntity(CropType entity) {
        if (entity == null) return null;
        return CropTypeResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .varietyCode(entity.getVarietyCode())
                .growthDaysStandard(entity.getGrowthDaysStandard())
                .waterNeedM3Day(entity.getWaterNeedM3Day())
                .optimalTempMin(entity.getOptimalTempMin())
                .optimalTempMax(entity.getOptimalTempMax())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
