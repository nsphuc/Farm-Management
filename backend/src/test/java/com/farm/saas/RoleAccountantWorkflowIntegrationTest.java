package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.hr.dto.request.AdjustAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.ApproveLeaveRequest;
import com.farm.saas.modules.hr.dto.request.ApproveOvertimeRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateCostCategoryRequest;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.finance.dto.request.CreateFarmExpenseRequest;
import com.farm.saas.modules.finance.dto.request.CreatePaymentTransactionRequest;
import com.farm.saas.modules.finance.dto.request.CreateSalesOrderRequest;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class RoleAccountantWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private CostCategoryRepository costCategoryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private com.farm.saas.modules.geography.repository.FarmRepository farmRepository;

    @Autowired
    private com.farm.saas.modules.auth.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("Kiểm thử toàn diện 4 mã lỗ hổng ROLE_ACCOUNTANT (GAP-ACC-01 -> GAP-ACC-04)")
    void testAccountantRoleWorkflow() throws Exception {
        // Tài khoản kế toán trại 1: 'accountant'
        String tokenAccountant = getAccessToken("accountant");
        // Tài khoản chủ trại / quản lý trại 1: 'owner'
        String tokenOwner = getAccessToken("owner");

        Long farmId = 1L;

        // =====================================================================
        // 1. GAP-ACC-01: Quản trị danh mục Nhóm chi phí kế toán
        // =====================================================================
        // Kế toán tra cứu danh mục nhóm chi phí
        mockMvc.perform(get("/api/v1/cost-categories")
                        .header("Authorization", "Bearer " + tokenAccountant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Kế toán tạo nhóm chi phí mới
        String catCode = "CC_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateCostCategoryRequest createCatReq = CreateCostCategoryRequest.builder()
                .code(catCode)
                .name("Chi phí thử nghiệm " + catCode)
                .costType("MATERIALS")
                .build();

        mockMvc.perform(post("/api/v1/cost-categories")
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createCatReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(catCode));

        // =====================================================================
        // 2. GAP-ACC-02: WS-B Chế độ đối soát bảng công & tính lương (Read-Only)
        // =====================================================================
        // 2.1. Tra cứu hồ sơ nhân sự trang trại
        mockMvc.perform(get("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .param("farmId", farmId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 2.2. Tra cứu bảng chấm công thực tế
        mockMvc.perform(get("/api/v1/hr/attendance")
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .param("farmId", farmId.toString())
                        .param("workDate", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 2.3. Tra cứu danh sách đơn nghỉ phép
        mockMvc.perform(get("/api/v1/hr/leaves")
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .param("farmId", farmId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 2.4. Tra cứu danh sách tăng ca (OT)
        mockMvc.perform(get("/api/v1/hr/overtime")
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .param("farmId", farmId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 2.5. Bảo mật SoD: Kế toán KHÔNG ĐƯỢC điều chỉnh giờ công (403 Forbidden)
        AdjustAttendanceRequest adjustReq = AdjustAttendanceRequest.builder()
                .checkInTime(java.time.Instant.now())
                .checkOutTime(java.time.Instant.now().plusSeconds(28800))
                .adjustmentReason("Gian lận chỉnh sửa giờ công kiểm toán")
                .build();

        mockMvc.perform(put("/api/v1/hr/attendance/{id}/adjust", 999999L)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isForbidden());

        // 2.6. Bảo mật SoD: Kế toán KHÔNG ĐƯỢC duyệt đơn nghỉ phép (403 Forbidden)
        ApproveLeaveRequest approveLeaveReq = ApproveLeaveRequest.builder()
                .status("APPROVED")
                .build();

        mockMvc.perform(put("/api/v1/hr/leaves/{id}/approve", 999999L)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveLeaveReq)))
                .andExpect(status().isForbidden());

        // 2.7. Bảo mật SoD: Kế toán KHÔNG ĐƯỢC duyệt đơn tăng ca (403 Forbidden)
        ApproveOvertimeRequest approveOtReq = ApproveOvertimeRequest.builder()
                .status("APPROVED")
                .build();

        mockMvc.perform(put("/api/v1/hr/overtime/{id}/approve", 999999L)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveOtReq)))
                .andExpect(status().isForbidden());

        // =====================================================================
        // 3. GAP-ACC-03: Chuẩn hóa RBAC tra cứu mùa vụ, đàn nuôi & lô thành phẩm
        // =====================================================================
        // 3.1. Tra cứu mùa vụ canh tác
        mockMvc.perform(get("/api/v1/farms/{farmId}/crop-seasons", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 3.2. Tra cứu đàn nuôi
        mockMvc.perform(get("/api/v1/farms/{farmId}/livestock-groups", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 3.3. Tra cứu lô thành phẩm phục vụ xuất kho / lập đơn bán sỉ
        mockMvc.perform(get("/api/v1/farms/{farmId}/product-batches", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // =====================================================================
        // 4. GAP-ACC-04: Chuẩn Maker-Checker khi lập dự toán ngân sách
        // =====================================================================
        // Lấy 1 cost category hợp lệ
        var cat = costCategoryRepository.findAll().stream().findFirst().orElseThrow();

        // 4.1. Kế toán (Maker) lập dự toán ngân sách -> Bắt buộc lưu ở trạng thái DRAFT
        String budgetName = "Ngân Sách Thử Nghiệm " + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateBudgetRequest budgetReq = CreateBudgetRequest.builder()
                .name(budgetName)
                .fiscalYear(LocalDate.now().getYear())
                .totalBudgetAmount(new BigDecimal("50000000.00"))
                .items(List.of(
                        CreateBudgetRequest.BudgetItemRequest.builder()
                                .costCategoryId(cat.getId())
                                .allocatedAmount(new BigDecimal("50000000.00"))
                                .notes("Hạn mức phân bổ thử nghiệm")
                                .build()
                ))
                .build();

        var createBudgetResult = mockMvc.perform(post("/api/v1/farms/{farmId}/budgets", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(budgetReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        JsonNode budgetNode = objectMapper.readTree(createBudgetResult.getResponse().getContentAsString());
        Long budgetId = budgetNode.get("id").asLong();

        // 4.2. Kế toán (Maker) tự bấm phê duyệt -> Bị chặn 403 Forbidden (Không phải Checker)
        mockMvc.perform(post("/api/v1/farms/{farmId}/budgets/{id}/approve", farmId, budgetId)
                        .header("Authorization", "Bearer " + tokenAccountant))
                .andExpect(status().isForbidden());

        // 4.3. Giám đốc trang trại / Chủ sở hữu (Checker) phê duyệt -> Thành công chuyển sang ACTIVE
        mockMvc.perform(post("/api/v1/farms/{farmId}/budgets/{id}/approve", farmId, budgetId)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Kiểm thử thông báo tự động 2 chiều cho Tài chính - Thương mại (GAP-ACC-06, GAP-ACC-07, GAP-ACC-08)")
    void testFinanceTwoWayNotificationWorkflow() throws Exception {
        Long farmId = 1L;

        // Đảm bảo farm_manager có user_farm_access với trang trại 1 và là manager_user_id của trang trại 1
        var managerUser = userRepository.findByUsername("farm_manager").orElseThrow();
        Long managerUserId = managerUser.getId();
        jdbcTemplate.update("INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES (?, ?, ?)", managerUserId, farmId, 1L);
        jdbcTemplate.update("UPDATE farms SET manager_user_id = ? WHERE id = ?", managerUserId, farmId);

        String tokenAccountant = getAccessToken("accountant");
        String tokenManager = getAccessToken("farm_manager");

        Long accountantUserId = userRepository.findByUsername("accountant")
                .map(com.farm.saas.modules.auth.entity.User::getId)
                .orElse(6L);
        Long warehouseUserId = userRepository.findByUsername("warehouse")
                .map(com.farm.saas.modules.auth.entity.User::getId)
                .orElse(4L);

        // =====================================================================
        // 1. GAP-ACC-06: Quy trình chi phí vận hành (Farm Expense 2-way notifications)
        // =====================================================================
        var cat = costCategoryRepository.findAll().stream().findFirst().orElseThrow();
        String expCode = "EXP-NOTIF-" + UUID.randomUUID().toString().substring(0, 6);
        CreateFarmExpenseRequest expReq = CreateFarmExpenseRequest.builder()
                .costCategoryId(cat.getId())
                .expenseCode(expCode)
                .expenseSource("MANUAL")
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("1500000.00"))
                .paymentMethod("CASH")
                .recipientName("Cửa hàng vật tư nông nghiệp ABC")
                .notes("Chi phí mua bao bì đóng gói")
                .build();

        var createExpRes = mockMvc.perform(post("/api/v1/farms/{farmId}/expenses", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        Long expenseId = objectMapper.readTree(createExpRes.getResponse().getContentAsString()).get("id").asLong();

        // Kiểm tra Giám đốc trang trại nhận được thông báo SYSTEM về chứng từ chi phí mới
        List<Notification> ownerNotifs = notificationRepository.findAll().stream()
                .filter(n -> managerUserId.equals(n.getUserId()) && "FARM_EXPENSE".equals(n.getReferenceType()) && expenseId.equals(n.getReferenceId()))
                .toList();
        assertFalse(ownerNotifs.isEmpty(), "Giám đốc trang trại phải nhận được thông báo chi phí chờ duyệt");
        assertEquals("SYSTEM", ownerNotifs.get(0).getType());

        // Giám đốc phê duyệt chi phí -> Kế toán nhận được thông báo
        mockMvc.perform(post("/api/v1/farms/{farmId}/expenses/{id}/confirm", farmId, expenseId)
                        .header("Authorization", "Bearer " + tokenManager))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        List<Notification> accountantNotifs = notificationRepository.findAll().stream()
                .filter(n -> accountantUserId.equals(n.getUserId()) && "FARM_EXPENSE".equals(n.getReferenceType()) && expenseId.equals(n.getReferenceId()))
                .toList();
        assertFalse(accountantNotifs.isEmpty(), "Kế toán phải nhận được thông báo chi phí đã được phê duyệt");
        assertTrue(accountantNotifs.get(0).getTitle().contains("đã được phê duyệt"));

        // =====================================================================
        // 2. GAP-ACC-07: Quy trình Đơn bán sỉ B2B (Sales Order 2-way notifications)
        // =====================================================================
        Partner partner = partnerRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()) && ("BUYER".equalsIgnoreCase(p.getPartnerType()) || "AGENT".equalsIgnoreCase(p.getPartnerType())))
                .findFirst()
                .orElseGet(() -> partnerRepository.save(Partner.builder()
                        .tenantId(1L)
                        .farmId(farmId)
                        .code("BUYER-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                        .name("Đại Lý Bán Buôn Test")
                        .partnerType("BUYER")
                        .creditLimit(new BigDecimal("100000000.00"))
                        .status("ACTIVE")
                        .build()));

        CreateSalesOrderRequest orderReq = CreateSalesOrderRequest.builder()
                .partnerId(partner.getId())
                .orderDate(LocalDate.now())
                .notes("Đơn hàng bán sỉ mẫu kiểm thử")
                .items(List.of(
                        CreateSalesOrderRequest.SalesOrderItemRequest.builder()
                                .itemName("Xoài cát Hòa Lộc VietGAP")
                                .quantity(new BigDecimal("500.00"))
                                .unit("kg")
                                .unitPrice(new BigDecimal("45000.00"))
                                .build()
                ))
                .build();

        var createOrderRes = mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        Long orderId = objectMapper.readTree(createOrderRes.getResponse().getContentAsString()).get("id").asLong();

        // Kiểm tra Giám đốc nhận thông báo đơn bán sỉ mới
        List<Notification> orderNotifsManager = notificationRepository.findAll().stream()
                .filter(n -> managerUserId.equals(n.getUserId()) && "SALES_ORDER".equals(n.getReferenceType()) && orderId.equals(n.getReferenceId()))
                .toList();
        assertFalse(orderNotifsManager.isEmpty(), "Giám đốc trang trại phải nhận được thông báo đơn bán sỉ chờ duyệt");

        // Giám đốc phê duyệt đơn bán sỉ -> Kế toán và Thủ kho cùng nhận được thông báo
        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders/{id}/confirm", farmId, orderId)
                        .header("Authorization", "Bearer " + tokenManager))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Kế toán nhận thông báo đơn duyệt
        List<Notification> soNotifsAcc = notificationRepository.findAll().stream()
                .filter(n -> accountantUserId.equals(n.getUserId()) && "SALES_ORDER".equals(n.getReferenceType()) && orderId.equals(n.getReferenceId()))
                .toList();
        assertFalse(soNotifsAcc.isEmpty(), "Kế toán phải nhận được thông báo đơn bán sỉ đã được duyệt");

        // Thủ kho nhận thông báo chuẩn bị hàng
        List<Notification> soNotifsWh = notificationRepository.findAll().stream()
                .filter(n -> warehouseUserId.equals(n.getUserId()) && "SALES_ORDER".equals(n.getReferenceType()) && orderId.equals(n.getReferenceId()))
                .toList();
        assertFalse(soNotifsWh.isEmpty(), "Thủ kho phải nhận được lệnh xuất chuẩn bị giao hàng");

        // =====================================================================
        // 3. GAP-ACC-08: Quy trình Giao dịch thanh toán & Dự toán ngân sách
        // =====================================================================
        // 3.1. Kế toán lập phiếu chi thanh toán mới (Maker -> PENDING)
        CreatePaymentTransactionRequest payReq = CreatePaymentTransactionRequest.builder()
                .partnerId(partner.getId())
                .paymentType("PAYMENT")
                .paymentMethod("BANK_TRANSFER")
                .amount(new BigDecimal("5000000.00"))
                .paymentDate(LocalDate.now())
                .notes("Chi tiền tạm ứng dịch vụ vận tải")
                .build();

        var createPayRes = mockMvc.perform(post("/api/v1/farms/{farmId}/payments", farmId)
                        .header("Authorization", "Bearer " + tokenAccountant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long paymentId = objectMapper.readTree(createPayRes.getResponse().getContentAsString()).get("id").asLong();

        // Giám đốc nhận được thông báo biến động giao dịch thanh toán
        List<Notification> payNotifsManager = notificationRepository.findAll().stream()
                .filter(n -> managerUserId.equals(n.getUserId()) && "PAYMENT_TRANSACTION".equals(n.getReferenceType()) && paymentId.equals(n.getReferenceId()))
                .toList();
        assertFalse(payNotifsManager.isEmpty(), "Giám đốc trang trại phải nhận được thông báo giao dịch thanh toán");
        assertEquals("SYSTEM", payNotifsManager.get(0).getType());

        // Giám đốc hủy phiếu thanh toán -> Kế toán nhận thông báo WARNING
        mockMvc.perform(post("/api/v1/farms/{farmId}/payments/{id}/cancel", farmId, paymentId)
                        .header("Authorization", "Bearer " + tokenManager)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Sai sót chứng từ chuyển khoản"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        List<Notification> payCancelNotifsAcc = notificationRepository.findAll().stream()
                .filter(n -> accountantUserId.equals(n.getUserId()) && "PAYMENT_TRANSACTION".equals(n.getReferenceType()) && paymentId.equals(n.getReferenceId()) && "WARNING".equals(n.getType()))
                .toList();
        assertFalse(payCancelNotifsAcc.isEmpty(), "Kế toán phải nhận được thông báo WARNING khi phiếu thanh toán bị hủy");
    }
}
