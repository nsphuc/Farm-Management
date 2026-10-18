package com.farm.saas.modules.geography.dto.response;

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
public class ProductionZoneResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String code;
    private String name;
    private String zoneType;
    private BigDecimal areaM2;
    private String soilType;
    private String waterSource;
    private String mapLayoutJson;
    private String status;
    private Long activeLocationsCount;
    private Instant createdAt;
}
