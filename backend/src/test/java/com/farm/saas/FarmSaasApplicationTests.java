package com.farm.saas;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
class FarmSaasApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("1. Spring Application Context khoi tao thanh cong")
    void contextLoads() {
        assertNotNull(jdbcTemplate, "JdbcTemplate phai duoc khoi tao thanh cong");
    }

    @Test
    @DisplayName("2. Xac nhan Flyway migrations V1.0, V1.1 va V1.2 ap dung thanh cong")
    void verifyFlywayMigrationApplied() {
        Integer v10Count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1.0' AND success = 1",
                Integer.class
        );
        assertNotNull(v10Count);
        assertTrue(v10Count >= 1, "Flyway schema history phai ghi nhan migration V1.0 thanh cong");

        Integer v11Count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1.1' AND success = 1",
                Integer.class
        );
        assertNotNull(v11Count);
        assertTrue(v11Count >= 1, "Flyway schema history phai ghi nhan migration V1.1 thanh cong");

        Integer v12Count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1.2' AND success = 1",
                Integer.class
        );
        assertNotNull(v12Count);
        assertTrue(v12Count >= 1, "Flyway schema history phai ghi nhan migration V1.2 thanh cong");
    }

    @Test
    @DisplayName("3. Xac nhan du 72 bang nghiep vu (70 core + notifications + refresh_tokens)")
    void verifyTotalBusinessTablesCount() {
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables " +
                "WHERE table_schema = DATABASE() " +
                "AND table_type = 'BASE TABLE' " +
                "AND table_name <> 'flyway_schema_history'",
                Integer.class
        );
        assertNotNull(tableCount);
        assertEquals(72, tableCount, "So luong bang nghiep vu thuc te phai dung bang 72 (70 core + notifications + refresh_tokens)");
    }

    @Test
    @DisplayName("4. Xac nhan bang notifications ton tai va co du cac cot bat buoc")
    void verifyNotificationsTableStructure() {
        Integer columnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                "WHERE table_schema = DATABASE() " +
                "AND table_name = 'notifications' " +
                "AND column_name IN ('id', 'tenant_id', 'user_id', 'title', 'message', 'type', 'is_read', 'read_at', 'reference_type', 'reference_id', 'action_url', 'created_at')",
                Integer.class
        );
        assertNotNull(columnCount);
        assertEquals(12, columnCount, "Bang notifications phai co day du 12 cot yeu cau");
    }

    @Test
    @DisplayName("5. Xac nhan RBAC Patch (DEC-01, DEC-02, DEC-03)")
    void verifyRbacPatch() {
        // 5.1 DEC-01: ROLE_SUPER_ADMIN co PERM_TENANT_MANAGE
        Integer superAdminTenantManageCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                "JOIN roles r ON rp.role_id = r.id " +
                "JOIN permissions p ON rp.permission_id = p.id " +
                "WHERE r.code = 'ROLE_SUPER_ADMIN' AND p.code = 'PERM_TENANT_MANAGE'",
                Integer.class
        );
        assertNotNull(superAdminTenantManageCount);
        assertEquals(1, superAdminTenantManageCount, "ROLE_SUPER_ADMIN phai co quyen PERM_TENANT_MANAGE");

        // 5.2 DEC-02: ROLE_TECHNICAL_STAFF khong co PERM_QC_APPROVE va PERM_QC_RECALL
        Integer techStaffQcCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                "JOIN roles r ON rp.role_id = r.id " +
                "JOIN permissions p ON rp.permission_id = p.id " +
                "WHERE r.code = 'ROLE_TECHNICAL_STAFF' AND p.code IN ('PERM_QC_APPROVE', 'PERM_QC_RECALL')",
                Integer.class
        );
        assertNotNull(techStaffQcCount);
        assertEquals(0, techStaffQcCount, "ROLE_TECHNICAL_STAFF khong duoc phep co PERM_QC_APPROVE hoac PERM_QC_RECALL");

        // 5.3 DEC-02: ROLE_FARM_OWNER co PERM_QC_APPROVE va PERM_QC_RECALL
        Integer ownerQcCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                "JOIN roles r ON rp.role_id = r.id " +
                "JOIN permissions p ON rp.permission_id = p.id " +
                "WHERE r.code = 'ROLE_FARM_OWNER' AND p.code IN ('PERM_QC_APPROVE', 'PERM_QC_RECALL')",
                Integer.class
        );
        assertNotNull(ownerQcCount);
        assertEquals(2, ownerQcCount, "ROLE_FARM_OWNER phai co du ca PERM_QC_APPROVE va PERM_QC_RECALL");

        // 5.4 DEC-03: ROLE_WAREHOUSE_STAFF va ROLE_ACCOUNTANT khong co PERM_HR_ATTENDANCE
        Integer hrAttendanceCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                "JOIN roles r ON rp.role_id = r.id " +
                "JOIN permissions p ON rp.permission_id = p.id " +
                "WHERE r.code IN ('ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT') AND p.code = 'PERM_HR_ATTENDANCE'",
                Integer.class
        );
        assertNotNull(hrAttendanceCount);
        assertEquals(0, hrAttendanceCount, "ROLE_WAREHOUSE_STAFF va ROLE_ACCOUNTANT khong duoc co quyen PERM_HR_ATTENDANCE");
    }

    @Test
    @DisplayName("6. Xac nhan System Info endpoint hoat dong voi ApiResponse va Correlation ID")
    void verifySystemInfoEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/system/info"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Correlation-ID"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RUNNING"))
                .andExpect(jsonPath("$.data.application").value("farm-saas-backend"));
    }

    @Test
    @DisplayName("7. Xac nhan OpenAPI /v3/api-docs endpoint phan hoi thanh cong")
    void verifyOpenApiDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Farm SaaS API - Hệ thống quản lý đa trang trại"));
    }
}
