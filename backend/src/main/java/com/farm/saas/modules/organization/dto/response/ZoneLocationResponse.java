package com.farm.saas.modules.organization.dto.response;

import lombok.*;

import java.time.Instant;

/**
 * DTO phản hồi thông tin Vị trí chi tiết trong phân khu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneLocationResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long zoneId;
    private String code;
    private String name;
    private String description;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
