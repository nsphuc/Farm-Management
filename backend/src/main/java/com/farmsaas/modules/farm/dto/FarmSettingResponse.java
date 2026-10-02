package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.FarmOperationalSetting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmSettingResponse {

    private Long id;
    private Long farmId;
    private Long tenantId;
    private String irrigationThresholdJson;
    private String workShiftConfigJson;
    private String generalSettingsJson;
    private Instant updatedAt;

    public static FarmSettingResponse fromEntity(FarmOperationalSetting entity) {
        if (entity == null) return null;
        return FarmSettingResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .tenantId(entity.getTenantId())
                .irrigationThresholdJson(entity.getIrrigationThresholdJson())
                .workShiftConfigJson(entity.getWorkShiftConfigJson())
                .generalSettingsJson(entity.getGeneralSettingsJson())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
