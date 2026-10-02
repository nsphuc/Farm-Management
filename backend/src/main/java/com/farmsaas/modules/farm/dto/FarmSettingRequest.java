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
public class FarmSettingRequest {

    private String irrigationThresholdJson;
    private String workShiftConfigJson;
    private String generalSettingsJson;
}
