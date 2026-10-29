package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.response.PlatformMetricsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/platform/metrics")
@RequiredArgsConstructor
@Tag(name = "Platform Metrics", description = "Số liệu thống kê toàn nền tảng và giám sát sức khỏe hạ tầng SaaS")
public class PlatformMetricsController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TENANT_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    @Operation(summary = "Lấy số liệu thống kê thời gian thực toàn nền tảng và sức khỏe JVM/Database")
    public ResponseEntity<PlatformMetricsResponse> getPlatformMetrics() {
        // 1. Thống kê Tenants
        Long totalTenants = queryCount("SELECT COUNT(*) FROM tenants");
        Long activeTenants = queryCount("SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE'");
        Long suspendedTenants = queryCount("SELECT COUNT(*) FROM tenants WHERE status IN ('SUSPENDED', 'INACTIVE')");

        // 2. Thống kê Farms & Users & Subscriptions
        Long totalFarms = queryCount("SELECT COUNT(*) FROM farms WHERE status != 'DELETED'");
        Long totalUsers = queryCount("SELECT COUNT(*) FROM users WHERE status != 'DELETED'");
        Long activeSubs = queryCount("SELECT COUNT(*) FROM tenant_subscriptions WHERE is_active = TRUE");
        Long expiringSoon = queryCount("SELECT COUNT(*) FROM tenant_subscriptions WHERE is_active = TRUE AND valid_to BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)");

        // 3. Phân bổ Gói cước (Plan distribution)
        Map<String, Long> planDistribution = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> planRows = jdbcTemplate.queryForList(
                    "SELECT COALESCE(plan_type, 'FREE') AS plan, COUNT(*) AS cnt " +
                    "FROM tenant_subscriptions WHERE is_active = TRUE GROUP BY plan_type");
            for (Map<String, Object> row : planRows) {
                String plan = (String) row.get("plan");
                Long count = ((Number) row.get("cnt")).longValue();
                planDistribution.put(plan, count);
            }
        } catch (Exception ex) {
            log.warn("Could not query plan distribution: {}", ex.getMessage());
        }

        // 4. Sức khỏe Cơ sở dữ liệu & Flyway
        String dbStatus = "UP";
        Integer appliedMigrations = 0;
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1", Integer.class);
            appliedMigrations = count != null ? count : 0;
        } catch (Exception ex) {
            log.warn("Could not check flyway schema history: {}", ex.getMessage());
            dbStatus = "DEGRADED";
        }

        // 5. Chỉ số JVM Runtime & Uptime
        Runtime runtime = Runtime.getRuntime();
        long maxMem = runtime.maxMemory() / (1024 * 1024);
        long totalMem = runtime.totalMemory() / (1024 * 1024);
        long freeMem = runtime.freeMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;
        int processors = runtime.availableProcessors();

        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        long uptimeSec = uptimeMs / 1000;
        String uptimeFormatted = formatUptime(uptimeSec);

        PlatformMetricsResponse response = PlatformMetricsResponse.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .suspendedTenants(suspendedTenants)
                .totalFarms(totalFarms)
                .totalUsers(totalUsers)
                .activeSubscriptionsCount(activeSubs)
                .expiringSoonCount(expiringSoon)
                .planDistribution(planDistribution)
                .databaseStatus(dbStatus)
                .appliedMigrationsCount(appliedMigrations)
                .jvmMaxMemoryMb(maxMem)
                .jvmTotalMemoryMb(totalMem)
                .jvmUsedMemoryMb(usedMem)
                .jvmFreeMemoryMb(freeMem)
                .availableProcessors(processors)
                .uptimeSeconds(uptimeSec)
                .uptimeFormatted(uptimeFormatted)
                .serverTime(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(response);
    }

    private Long queryCount(String sql) {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception ex) {
            log.warn("Error running count query [{}]: {}", sql, ex.getMessage());
            return 0L;
        }
    }

    private String formatUptime(long totalSeconds) {
        long days = totalSeconds / (24 * 3600);
        long hours = (totalSeconds % (24 * 3600)) / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        if (days > 0) {
            return String.format("%d ngày %d giờ %d phút", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%d giờ %d phút %d giây", hours, minutes, seconds);
        } else {
            return String.format("%d phút %d giây", minutes, seconds);
        }
    }
}

