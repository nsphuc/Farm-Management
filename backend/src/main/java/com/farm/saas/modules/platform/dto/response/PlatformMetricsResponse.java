package com.farm.saas.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsResponse {

    // 1. Thống kê Khách thuê (Tenants)
    private Long totalTenants;
    private Long activeTenants;
    private Long suspendedTenants;

    // 2. Thống kê Quy mô Vận hành Toàn Nền tảng
    private Long totalFarms;
    private Long totalUsers;
    private Long activeSubscriptionsCount;
    private Long expiringSoonCount;
    private Map<String, Long> planDistribution;

    // 3. Chỉ số Sức khỏe Hạ tầng & JVM (Infrastructure Health)
    private String databaseStatus;
    private Integer appliedMigrationsCount;
    private Long jvmMaxMemoryMb;
    private Long jvmTotalMemoryMb;
    private Long jvmUsedMemoryMb;
    private Long jvmFreeMemoryMb;
    private Integer availableProcessors;
    private Long uptimeSeconds;
    private String uptimeFormatted;
    private LocalDateTime serverTime;
}

