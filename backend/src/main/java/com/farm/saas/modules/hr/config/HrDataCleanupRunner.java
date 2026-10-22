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
}
