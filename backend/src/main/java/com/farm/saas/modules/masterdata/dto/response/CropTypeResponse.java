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
}
