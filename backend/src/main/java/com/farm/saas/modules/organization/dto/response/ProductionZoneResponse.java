package com.farm.saas.modules.organization.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi thông tin chi tiết Phân khu sản xuất.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionZoneResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String code;
    private String name;
    private String zoneType;
    private BigDecimal areaM2;
    private String soilType;
    private String waterSource;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
