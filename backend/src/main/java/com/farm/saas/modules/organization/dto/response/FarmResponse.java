package com.farm.saas.modules.organization.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi thông tin chi tiết Trang trại.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
