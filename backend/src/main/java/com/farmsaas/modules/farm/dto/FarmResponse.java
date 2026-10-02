package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.Farm;
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
public class FarmResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String farmType;
    private BigDecimal totalAreaM2;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private Long managerUserId;
    private String managerName;
    private String status;
    private long zoneCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static FarmResponse fromEntity(Farm farm, long zoneCount) {
        if (farm == null) return null;
        return FarmResponse.builder()
                .id(farm.getId())
                .tenantId(farm.getTenantId())
                .code(farm.getCode())
                .name(farm.getName())
                .farmType(farm.getFarmType())
                .totalAreaM2(farm.getTotalAreaM2())
                .latitude(farm.getLatitude())
                .longitude(farm.getLongitude())
                .address(farm.getAddress())
                .managerUserId(farm.getManagerUserId())
                .managerName(farm.getManager() != null ? farm.getManager().getFullName() : null)
                .status(farm.getStatus())
                .zoneCount(zoneCount)
                .createdAt(farm.getCreatedAt())
                .updatedAt(farm.getUpdatedAt())
                .build();
    }
}
