package com.farm.saas.modules.geography.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockFacilityResponse {
    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String facilityType;
    private String businessName;
    private String taxCode;
    private String managementDomain;
    private String livestockSector;
    private String livestockType;
    private String province;
    private String ward;
    private String address;
    private String status;
    private Boolean isDemo;
    private Instant demoExpiresAt;
    private String subscriptionTier;
    private Integer managerAccountsCount;
    private Integer subscriptionDurationYears;
    private Instant createdAt;
}
