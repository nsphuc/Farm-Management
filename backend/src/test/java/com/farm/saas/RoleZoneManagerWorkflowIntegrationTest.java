package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.hr.dto.request.BatchRollCallRequest;
import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.request.UpdateTaskStatusRequest;
import com.farm.saas.modules.hr.entity.FarmTask;
import com.farm.saas.modules.hr.repository.FarmTaskRepository;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Integration Test cho vai trò Trưởng Phân Khu / Tổ Trưởng Hiện Trường (ROLE_ZONE_MANAGER)
 * Kiểm thử toàn diện các mã lỗ hổng từ GAP-ZM-01 đến GAP-ZM-07:
 * - GAP-ZM-01: Tài khoản mẫu zone_manager được khởi tạo đầy đủ và idempotent
 * - GAP-ZM-02: Phân quyền truy cập sơ đồ phân khu WS-A
 * - GAP-ZM-03: Giao việc phát sinh và nghiệm thu công việc phân khu (không bị 403)
 * - GAP-ZM-04: Thăng cấp quyền động (Dynamic Field Leadership Promotion: PERM_TASK_ASSIGN)
 * - GAP-ZM-05: Định danh useAuthStore & Bàn làm việc 3 Workspaces
 * - GAP-ZM-06: Đồng bộ dữ liệu tổ viên và điểm danh tập thể
 * - GAP-ZM-07: Hệ thống thông báo phân tầng hiện trường (giao việc, duyệt nghiệm thu, yêu cầu làm lại, điểm danh)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class RoleZoneManagerWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private FarmTaskRepository farmTaskRepository;

    @Autowired
    private com.farm.saas.modules.geography.repository.FarmRepository farmRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("Kiểm thử toàn diện 7 mã lỗ hổng ROLE_ZONE_MANAGER (GAP-ZM-01 -> GAP-ZM-07)")
    void testZoneManagerCompleteWorkflow() throws Exception {
        // =====================================================================
        // 1. GAP-ZM-01 & GAP-ZM-04: Khởi tạo tài khoản & Thăng cấp quyền động
        // =====================================================================
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("zone_manager");
        assertNotNull(userDetails, "Tài khoản zone_manager phải được nạp thành công từ database");

        List<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Kiểm tra quyền cơ bản của ROLE_FIELD_STAFF
        assertTrue(authorities.contains("PERM_FARM_VIEW"), "Phải có PERM_FARM_VIEW");
        assertTrue(authorities.contains("PERM_CROP_VIEW"), "Phải có PERM_CROP_VIEW");
        assertTrue(authorities.contains("PERM_CROP_LOG"), "Phải có PERM_CROP_LOG");
        assertTrue(authorities.contains("PERM_HARVEST_MANAGE"), "Phải có PERM_HARVEST_MANAGE");
        assertTrue(authorities.contains("PERM_HR_ATTENDANCE"), "Phải có PERM_HR_ATTENDANCE");

        // Kiểm tra Dynamic Field Leadership Promotion: Phải tự động có PERM_TASK_ASSIGN
        assertTrue(authorities.contains("PERM_TASK_ASSIGN"),
                "Tài khoản có role_in_farm = 'ZONE_MANAGER' phải được thăng cấp động quyền PERM_TASK_ASSIGN!");

        String tokenZoneManager = jwtTokenProvider.generateAccessToken(userDetails);
        Long farmId = 1L;

        // =====================================================================
        // 2. GAP-ZM-05: Định danh API /api/v1/auth/me trả về ZONE_MANAGER
        // =====================================================================
        MvcResult meResult = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenZoneManager))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("zone_manager"))
                .andExpect(jsonPath("$.operationalRole").value("ZONE_MANAGER"))
                .andReturn();

        JsonNode meJson = objectMapper.readTree(meResult.getResponse().getContentAsString());
        assertEquals("ZONE_MANAGER", meJson.path("operationalRole").asText(),
                "operationalRole phải trả về ZONE_MANAGER cho Trưởng phân khu");

        // =====================================================================
        // 3. GAP-ZM-02: WS-A Sơ đồ phân khu & Không gian địa lý
        // =====================================================================
        mockMvc.perform(get("/api/v1/farms/{farmId}/zones", farmId)
                        .header("Authorization", "Bearer " + tokenZoneManager))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // =====================================================================
        // 4. GAP-ZM-03 & GAP-ZM-07: Điều phối việc phân khu, Nghiệm thu & Thông báo
        // =====================================================================
        // 4.1. Lấy thông tin nhân viên để giao việc
        List<Long> employeeIds = jdbcTemplate.queryForList(
                "SELECT id FROM employees WHERE tenant_id = 1 AND farm_id = ? AND status = 'ACTIVE' LIMIT 2",
                Long.class, farmId);
        assertFalse(employeeIds.isEmpty(), "Cần ít nhất 1 nhân viên mẫu trong farm 1");
        Long targetEmployeeId = employeeIds.get(0);

        List<Long> zoneIds = jdbcTemplate.queryForList(
                "SELECT id FROM production_zones WHERE tenant_id = 1 AND farm_id = ? LIMIT 1",
                Long.class, farmId);
        Long zoneId = zoneIds.isEmpty() ? null : zoneIds.get(0);

        // Tạo nhiệm vụ phát sinh mới do zone_manager giao
        CreateFarmTaskRequest createTaskReq = CreateFarmTaskRequest.builder()
                .zoneId(zoneId)
                .taskTitle("[PHÁT SINH] Phun thuốc vi sinh phòng nấm phân khu A1")
                .taskType("FERTILIZING")
                .priority("HIGH")
                .assignedToEmployeeId(targetEmployeeId)
                .deadline(Instant.now().plus(4, ChronoUnit.HOURS))
                .completionNotes("Pha đúng tỷ lệ hướng dẫn và phun đều tán lá")
                .build();

        MvcResult taskResult = mockMvc.perform(post("/api/v1/farms/{farmId}/tasks", farmId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTaskReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskTitle").value("[PHÁT SINH] Phun thuốc vi sinh phòng nấm phân khu A1"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andReturn();

        JsonNode createdTaskJson = objectMapper.readTree(taskResult.getResponse().getContentAsString());
        Long createdTaskId = createdTaskJson.path("id").asLong();

        // Kiểm tra thông báo phân công nhiệm vụ tự động gửi đến công nhân (type = 'TASK')
        List<Notification> taskAssignNotifs = notificationRepository.findAll().stream()
                .filter(n -> "TASK".equals(n.getType()) && "FARM_TASK".equals(n.getReferenceType())
                        && n.getTitle() != null && n.getTitle().contains("Nhiệm vụ mới"))
                .collect(Collectors.toList());
        assertFalse(taskAssignNotifs.isEmpty(), "Hệ thống phải tự động gửi thông báo phân công nhiệm vụ (type = 'TASK')");

        // 4.2. Chuyển trạng thái sang IN_PROGRESS và sau đó PENDING_REVIEW
        UpdateTaskStatusRequest startTaskReq = UpdateTaskStatusRequest.builder()
                .status("IN_PROGRESS")
                .build();
        mockMvc.perform(put("/api/v1/tasks/{id}/status", createdTaskId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startTaskReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        UpdateTaskStatusRequest submitReviewReq = UpdateTaskStatusRequest.builder()
                .status("PENDING_REVIEW")
                .completionNotes("Đã phun xong 10 luống khu A1, đính kèm ảnh kiểm tra")
                .photosJson("[\"https://images.nongtrai.vn/evidence/spray_a1.jpg\"]")
                .build();
        mockMvc.perform(put("/api/v1/tasks/{id}/status", createdTaskId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));

        // 4.3. Zone Manager yêu cầu làm lại (PENDING_REVIEW -> IN_PROGRESS): Phải gửi thông báo WARNING
        UpdateTaskStatusRequest reworkReq = UpdateTaskStatusRequest.builder()
                .status("IN_PROGRESS")
                .completionNotes("Còn sót luống số 3 và 4 mép mương, đề nghị phun dặm lại ngay")
                .build();
        mockMvc.perform(put("/api/v1/tasks/{id}/status", createdTaskId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reworkReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Kiểm tra thông báo yêu cầu làm lại (type = 'WARNING')
        List<Notification> reworkNotifs = notificationRepository.findAll().stream()
                .filter(n -> "WARNING".equals(n.getType()) && "FARM_TASK".equals(n.getReferenceType())
                        && n.getTitle() != null && n.getTitle().contains("Yêu cầu thực hiện lại"))
                .collect(Collectors.toList());
        assertFalse(reworkNotifs.isEmpty(), "Hệ thống phải tự động gửi thông báo yêu cầu làm lại (type = 'WARNING')");

        // Đưa lại về PENDING_REVIEW để duyệt hoàn thành
        mockMvc.perform(put("/api/v1/tasks/{id}/status", createdTaskId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReviewReq)))
                .andExpect(status().isOk());

        // 4.4. Zone Manager duyệt nghiệm thu đạt chuẩn (PENDING_REVIEW -> DONE): Không bị 403 Forbidden!
        UpdateTaskStatusRequest approveReq = UpdateTaskStatusRequest.builder()
                .status("DONE")
                .completionNotes("Đã nghiệm thu đạt chuẩn sau khi phun dặm luống 3 và 4")
                .build();
        mockMvc.perform(put("/api/v1/tasks/{id}/status", createdTaskId)
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));

        // Kiểm tra thông báo nghiệm thu hoàn thành (type = 'TASK')
        List<Notification> approvedNotifs = notificationRepository.findAll().stream()
                .filter(n -> "TASK".equals(n.getType()) && "FARM_TASK".equals(n.getReferenceType())
                        && n.getTitle() != null && n.getTitle().contains("Nhiệm vụ đã được nghiệm thu"))
                .collect(Collectors.toList());
        assertFalse(approvedNotifs.isEmpty(), "Hệ thống phải tự động gửi thông báo duyệt nghiệm thu (type = 'TASK')");

        // =====================================================================
        // 5. GAP-ZM-03, GAP-ZM-06 & GAP-ZM-07: Điểm danh tổ (Batch Roll-Call)
        // =====================================================================
        com.farm.saas.modules.geography.entity.Farm targetFarm = farmRepository.findById(farmId).orElse(null);
        BigDecimal farmLat = targetFarm != null && targetFarm.getLatitude() != null
                ? targetFarm.getLatitude()
                : new BigDecimal("11.940419");
        BigDecimal farmLon = targetFarm != null && targetFarm.getLongitude() != null
                ? targetFarm.getLongitude()
                : new BigDecimal("108.458313");

        List<Long> shiftIds = jdbcTemplate.queryForList(
                "SELECT id FROM work_shifts WHERE tenant_id = 1 AND (farm_id = ? OR farm_id IS NULL) LIMIT 1",
                Long.class, farmId);
        Long shiftId;
        if (shiftIds.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO work_shifts (tenant_id, farm_id, name, shift_code, start_time, end_time, break_minutes, grace_late_minutes, is_overnight, created_at) " +
                            "VALUES (1, ?, 'Ca Sáng Nông Nghiệp', 'SHIFT_MORNING_TEST', '07:00:00', '15:30:00', 60, 15, FALSE, NOW())",
                    farmId);
            shiftId = jdbcTemplate.queryForObject(
                    "SELECT id FROM work_shifts WHERE tenant_id = 1 AND shift_code = 'SHIFT_MORNING_TEST'",
                    Long.class);
        } else {
            shiftId = shiftIds.get(0);
        }

        BatchRollCallRequest rollCallReq = BatchRollCallRequest.builder()
                .farmId(farmId)
                .shiftId(shiftId)
                .workDate(LocalDate.now())
                .actionType("CHECK_IN")
                .employeeIds(List.of(targetEmployeeId))
                .latitude(farmLat)
                .longitude(farmLon)
                .photoUrl("https://images.nongtrai.vn/rollcall/team_a1.jpg")
                .notes("Tổ sản xuất A1 vào ca sáng đủ quân số")
                .build();

        mockMvc.perform(post("/api/v1/hr/attendance/batch-roll-call")
                        .header("Authorization", "Bearer " + tokenZoneManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rollCallReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.successCount").value(greaterThanOrEqualTo(1)));

        // Kiểm tra thông báo điểm danh liên cấp gửi Giám đốc trại và Kế toán (type = 'SYSTEM')
        List<Notification> rollCallNotifs = notificationRepository.findAll().stream()
                .filter(n -> "SYSTEM".equals(n.getType()) && "BATCH_ROLL_CALL".equals(n.getReferenceType()))
                .collect(Collectors.toList());
        assertFalse(rollCallNotifs.isEmpty(),
                "Hệ thống phải tự động gửi thông báo điểm danh tập thể liên cấp (type = 'SYSTEM', referenceType = 'BATCH_ROLL_CALL')");

        // =====================================================================
        // 6. GAP-ZM-05: WS-E Nhật ký canh tác (Farming Logs)
        // =====================================================================
        mockMvc.perform(get("/api/v1/farms/{farmId}/farming-logs", farmId)
                        .header("Authorization", "Bearer " + tokenZoneManager))
                .andExpect(status().isOk());
    }
}
