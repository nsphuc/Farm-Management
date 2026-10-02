package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.ZoneLocation;
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
public class ZoneLocationResponse {

    private Long id;
    private Long zoneId;
    private Long tenantId;
    private String code;
    private String name;
    private String locationType;
    private BigDecimal areaM2;
    private Integer capacity;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static ZoneLocationResponse fromEntity(ZoneLocation entity) {
        if (entity == null) return null;
        return ZoneLocationResponse.builder()
                .id(entity.getId())
                .zoneId(entity.getZoneId())
                .tenantId(entity.getTenantId())
                .code(entity.getCode())
                .name(entity.getName())
                .locationType(entity.getLocationType())
                .areaM2(entity.getAreaM2())
                .capacity(entity.getCapacity())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
