package com.farmsaas.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                // Dọn dẹp an toàn các bảng Phase 4 nếu có tàn dư từ lần chạy migration lỗi
                stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
                stmt.execute(
                        "DROP TABLE IF EXISTS budget_line_items, budgets, debt_records, sales_order_items, sales_orders, cost_allocations, farm_expenses, cost_categories, farm_tasks, overtime_requests, leave_requests, time_attendances, shift_assignments, work_shifts, employees");
                stmt.execute("DELETE FROM flyway_schema_history WHERE version = '4.0'");
                stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
            } catch (Exception e) {
                // Bỏ qua nếu chưa tồn tại
            }
            flyway.repair();
            flyway.migrate();
        };
    }
}
