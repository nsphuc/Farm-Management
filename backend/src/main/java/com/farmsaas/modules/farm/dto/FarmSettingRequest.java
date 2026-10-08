package com.farmsaas.modules.farm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmSettingRequest {

    private String irrigationThresholdJson;
    private String workShiftConfigJson;
    private String generalSettingsJson;
}
