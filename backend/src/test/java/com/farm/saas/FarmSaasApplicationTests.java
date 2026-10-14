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
    @DisplayName("2. Xac nhan Flyway baseline migration V1_0 thanh cong")
    void verifyFlywayMigrationApplied() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1.0' AND success = 1",
                Integer.class
        );
        assertNotNull(count);
        assertTrue(count >= 1, "Flyway schema history phai ghi nhan migration V1_0 thanh cong");
    }

    @Test
    @DisplayName("3. Xac nhan du 70 bang nghiep vu trong co so du lieu")
    void verifyTotalBusinessTablesCount() {
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables " +
                "WHERE table_schema = DATABASE() " +
                "AND table_type = 'BASE TABLE' " +
                "AND table_name <> 'flyway_schema_history'",
                Integer.class
        );
        assertNotNull(tableCount);
        assertEquals(70, tableCount, "So luong bang nghiep vu thuc te phai dung bang 70");
    }

    @Test
    @DisplayName("4. Xac nhan du lieu seed (6 roles, 30 permissions)")
    void verifySeedData() {
        Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles", Integer.class);
        assertEquals(6, roleCount, "Phai khoi tao dung 6 roles mac dinh");

        Integer permCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permissions", Integer.class);
        assertEquals(30, permCount, "Phai khoi tao dung 30 permissions");

        Integer rolePermCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM role_permissions", Integer.class);
        assertNotNull(rolePermCount);
        assertTrue(rolePermCount > 0, "Bang lien ket role_permissions phai co du lieu seed");
    }

    @Test
    @DisplayName("5. Xac nhan System Info endpoint hoat dong voi ApiResponse va Correlation ID")
    void verifySystemInfoEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/system/info"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Correlation-ID"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RUNNING"))
                .andExpect(jsonPath("$.data.application").value("farm-saas-backend"));
    }

    @Test
    @DisplayName("6. Xac nhan OpenAPI /v3/api-docs endpoint phan hoi thanh cong")
    void verifyOpenApiDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Farm SaaS API - Hệ thống quản lý đa trang trại"));
    }
}
