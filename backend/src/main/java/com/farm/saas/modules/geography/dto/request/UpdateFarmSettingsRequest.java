package com.farm.saas.modules.geography.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFarmSettingsRequest {

    private String irrigationThresholdJson;
    private String workShiftConfigJson;
}
