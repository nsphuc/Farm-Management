package com.farm.saas.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDetailResponse {

    private Long id;
    private String code;
    private String name;
    private String subdomain;
    private String status;
    private String subscriptionPlan;
    private SubscriptionDto activeSubscription;
    private UsageDto currentUsage;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionDto {
        private Long id;
        private String planType;
        private Integer maxFarms;
        private Integer maxUsers;
        private LocalDate validFrom;
        private LocalDate validTo;
        private Long remainingDays;
        private Boolean isExpired;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageDto {
        private Long totalFarms;
        private Long totalUsers;
    }
}
