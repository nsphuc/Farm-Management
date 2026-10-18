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
public class ZoneLocationResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long zoneId;
    private String zoneName;
    private String code;
    private String name;
    private String description;
    private String status;
    private Instant createdAt;
}
