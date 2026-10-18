package com.farm.saas.modules.geography.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmOperationalSettingResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String irrigationThresholdJson;
    private String workShiftConfigJson;
    private Instant updatedAt;
}
