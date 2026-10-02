package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.ProductionZone;
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
public class ZoneResponse {

    private Long id;
    private Long farmId;
    private Long tenantId;
    private String code;
    private String name;
    private String zoneType;
    private BigDecimal areaM2;
    private String soilType;
    private String waterSource;
    private String status;
    private String notes;
    private long locationCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static ZoneResponse fromEntity(ProductionZone zone, long locationCount) {
        if (zone == null) return null;
        return ZoneResponse.builder()
                .id(zone.getId())
                .farmId(zone.getFarmId())
                .tenantId(zone.getTenantId())
                .code(zone.getCode())
                .name(zone.getName())
                .zoneType(zone.getZoneType())
                .areaM2(zone.getAreaM2())
                .soilType(zone.getSoilType())
                .waterSource(zone.getWaterSource())
                .status(zone.getStatus())
                .notes(zone.getNotes())
                .locationCount(locationCount)
                .createdAt(zone.getCreatedAt())
                .updatedAt(zone.getUpdatedAt())
                .build();
    }
}
