package com.farm.saas.modules.hr.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Khởi động dọn dẹp an toàn các bản ghi nhân sự test rác khỏi DB Dev/Staging.
 * Chống ô nhiễm dữ liệu từ các lần chạy Integration Test trước đó.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class HrDataCleanupRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            cleanupJunkTestData();
        } catch (Exception ex) {
            log.warn("Không thể hoàn tất dọn dẹp dữ liệu test rác khởi động: {}", ex.getMessage());
        }

        try {
            seedStandardEmployeeProfiles();
        } catch (Exception ex) {
            log.warn("Không thể hoàn tất khởi tạo hồ sơ nhân sự chuẩn: {}", ex.getMessage());
        }
    }

    /**
     * @deprecated Đã loại bỏ hoàn toàn việc tự động seed tài khoản mẫu khi phát hiện hệ thống trống.
     * Toàn bộ nhân sự và tài khoản sẽ do Quản trị viên/Chủ đầu tư tự tạo mới trên Web UI.
     */
    @Deprecated
    public void seedZoneManagerSampleAccount() {
        // No-op: Không tự động tạo tài khoản mẫu zone_manager
    }

    public void cleanupJunkTestData() {
        String findJunkIdsSql = "SELECT id FROM employees WHERE full_name = 'Trần Thị Chấm Công' " +
                "OR full_name LIKE '%Chấm Công%' " +
                "OR full_name = 'Nguyễn Vị Thành Niên' " +
                "OR employee_code IN ('EMP-1AB121', 'EMP-5D71FF', 'EMP-6D79F3', 'EMP-B16731', 'EMP-1537FE')";

        List<Long> junkEmployeeIds = jdbcTemplate.queryForList(findJunkIdsSql, Long.class);

        if (!junkEmployeeIds.isEmpty()) {
            log.info("Phát hiện {} bản ghi nhân viên test rác tồn đọng. Tiến hành dọn dẹp an toàn...", junkEmployeeIds.size());

            String inClause = "(" + String.join(",", junkEmployeeIds.stream().map(String::valueOf).toList()) + ")";

            // 1. Dọn dẹp liên kết
            jdbcTemplate.update("DELETE FROM time_attendances WHERE employee_id IN " + inClause);
            jdbcTemplate.update("DELETE FROM leave_requests WHERE employee_id IN " + inClause);
            jdbcTemplate.update("DELETE FROM overtime_requests WHERE employee_id IN " + inClause);
            jdbcTemplate.update("DELETE FROM shift_assignments WHERE employee_id IN " + inClause);
            jdbcTemplate.update("DELETE FROM farm_task_assignees WHERE employee_id IN " + inClause);
            jdbcTemplate.update("UPDATE farm_tasks SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id IN " + inClause);

            // 2. Xóa các bản ghi nhân viên test
            int deleted = jdbcTemplate.update("DELETE FROM employees WHERE id IN " + inClause);
            log.info("Đã xóa vĩnh viễn {} nhân viên test rác khỏi hệ thống.", deleted);
        }

        // 3. Xóa các ca làm việc test rác do test tạo ra
        try {
            int deletedShifts = jdbcTemplate.update(
                    "DELETE FROM work_shifts WHERE shift_code LIKE 'SH-TEST-%' OR name = 'Ca Sáng Trồng Trọt Test'");
            if (deletedShifts > 0) {
                log.info("Đã dọn dẹp {} ca làm việc test rác (SH-TEST-*) khỏi hệ thống.", deletedShifts);
            }
        } catch (Exception ignored) {
        }
    }

    public void seedStandardEmployeeProfiles() {
        String findUsersSql = "SELECT DISTINCT u.id, u.tenant_id, u.username, u.full_name, u.phone, u.email " +
                "FROM users u " +
                "JOIN user_roles ur ON u.id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.id " +
                "WHERE u.tenant_id IS NOT NULL " +
                "  AND r.code IN ('ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT', 'ROLE_FIELD_STAFF') " +
                "  AND NOT EXISTS ( " +
                "      SELECT 1 FROM employees e WHERE e.tenant_id = u.tenant_id AND e.user_id = u.id " +
                "  )";

        List<java.util.Map<String, Object>> missingUsers = jdbcTemplate.queryForList(findUsersSql);
        if (missingUsers.isEmpty()) {
            log.info("Tất cả tài khoản vận hành đều đã được liên kết với hồ sơ nhân sự Employee.");
            return;
        }

        log.info("Phát hiện {} tài khoản vận hành chưa có hồ sơ nhân sự. Bắt đầu tự động khởi tạo hồ sơ chuẩn...", missingUsers.size());
        for (java.util.Map<String, Object> row : missingUsers) {
            Long userId = ((Number) row.get("id")).longValue();
            Long tenantId = ((Number) row.get("tenant_id")).longValue();
            String username = (String) row.get("username");
            String fullName = (String) row.get("full_name");
            if (fullName == null || fullName.isBlank()) {
                fullName = username;
            }
            String phone = (String) row.get("phone");
            String email = (String) row.get("email");

            Long farmId = null;
            List<Long> farmIds = jdbcTemplate.queryForList(
                    "SELECT farm_id FROM user_farm_access WHERE user_id = ? AND farm_id IN (SELECT id FROM farms WHERE tenant_id = ?) LIMIT 1",
                    Long.class, userId, tenantId);
            if (!farmIds.isEmpty() && farmIds.get(0) != null) {
                farmId = farmIds.get(0);
            } else {
                List<Long> defaultFarmIds = jdbcTemplate.queryForList(
                        "SELECT id FROM farms WHERE tenant_id = ? ORDER BY id ASC LIMIT 1",
                        Long.class, tenantId);
                if (!defaultFarmIds.isEmpty()) {
                    farmId = defaultFarmIds.get(0);
                }
            }

            String employeeCode = "EMP-SEED-" + userId;
            Integer codeCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM employees WHERE tenant_id = ? AND employee_code = ?",
                    Integer.class, tenantId, employeeCode);
            if (codeCount != null && codeCount > 0) {
                employeeCode = "EMP-SEED-" + userId + "-" + (System.currentTimeMillis() % 1000);
            }

            String insertSql = "INSERT INTO employees (tenant_id, farm_id, user_id, employee_code, full_name, phone, email, " +
                    "joined_date, base_salary, hourly_rate, contract_type, annual_leave_quota, status, created_at, created_by) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 0, 0, 'FULL_TIME', 12.0, 'ACTIVE', NOW(), ?)";

            try {
                jdbcTemplate.update(insertSql, tenantId, farmId, userId, employeeCode, fullName, phone, email, userId);
                log.info("Đã tạo hồ sơ Employee tự động cho user: id={}, username={}, employeeCode={}, farmId={}",
                        userId, username, employeeCode, farmId);
            } catch (Exception ex) {
                log.warn("Không thể tạo tự động Employee cho userId {}: {}", userId, ex.getMessage());
            }
        }
    }
}

