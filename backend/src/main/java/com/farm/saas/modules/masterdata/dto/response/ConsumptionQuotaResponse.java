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
public class ConsumptionQuotaResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long cropTypeId;
    private String cropTypeName;
    private Long livestockBreedId;
    private String livestockBreedName;
    private Long materialId;
    private String materialName;
    private String materialStandardUnit;
    private BigDecimal standardQuantity;
    private String unitOfMeasure;
    private String stage;
    private Instant createdAt;
}
