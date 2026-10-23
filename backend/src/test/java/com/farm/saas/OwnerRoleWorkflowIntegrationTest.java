package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.entity.UserRole;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.auth.repository.UserRoleRepository;
import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.entity.SalesOrder;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.finance.repository.SalesOrderRepository;
import com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest;
import com.farm.saas.modules.geography.dto.request.CreateFarmRequest;
import com.farm.saas.modules.geography.dto.request.CreateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmRequest;
import com.farm.saas.modules.geography.dto.request.UpdateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.response.FarmDetailResponse;
import com.farm.saas.modules.geography.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.OperationalCycle;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.UserFarmAccessRepository;
import com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest;
import com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.platform.dto.request.CreatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerStatusRequest;
import com.farm.saas.modules.platform.dto.response.PartnerResponse;
import com.farm.saas.modules.platform.dto.response.TenantDetailResponse;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.quality.dto.request.RecallProductBatchRequest;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.TraceabilitySnapshotRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class OwnerRoleWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private EnterpriseRepository enterpriseRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private ProductionZoneRepository productionZoneRepository;

    @Autowired
    private UserFarmAccessRepository userFarmAccessRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private TraceabilitySnapshotRepository traceabilitySnapshotRepository;

    @Autowired
    private OperationalCycleRepository operationalCycleRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private FarmExpenseRepository farmExpenseRepository;

    @Autowired
    private com.farm.saas.modules.masterdata.repository.CostCategoryRepository costCategoryRepository;

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("Thực chiến toàn diện: 6 Khối Assert Cứng kiểm tra đúng luồng nghiệp vụ của Chủ Đầu Tư (ROLE_FARM_OWNER)")
    void testOwnerRoleFullWorkflow() throws Exception {
        // ====================================================================
        // DỮ LIỆU MỒI CHUẨN THỰC TẾ:
        // - Tạo 1 Doanh nghiệp (enterprises) có thông tin ngân hàng Napas247 chuẩn:
        //   bankBin = "970436", bankAccountNo = "0123456789", bankAccountName = "CONG TY NONG NGHIEP XANH"
        // - Đăng nhập bằng tài khoản Owner (ROLE_FARM_OWNER cấp TENANT)
        // - Tạo 2 trang trại thực tế hoàn toàn tách biệt:
        //   1. Trang Trại Bắc Ninh (totalAreaM2 = 50000, geofenceRadiusM = 300)
        //   2. Trang Trại Đà Lạt (totalAreaM2 = 80000, geofenceRadiusM = 500)
        // ====================================================================
        String tokenSuperAdmin = getAccessToken("admin");
        long timestamp = System.currentTimeMillis();
        String tenantCode = "TNT_OWNER_" + timestamp;
        String subdomain = "owner-" + timestamp;
        String ownerEmail = "owner_" + timestamp + "@greenfarm.vn";

        // Tạo Tenant
        CreateTenantRequest createTenantReq = CreateTenantRequest.builder()
                .code(tenantCode)
                .name("Doanh Nghiệp Nông Nghiệp Xanh " + timestamp)
                .subdomain(subdomain)
                .planType("ENTERPRISE")
                .maxFarms(10)
                .maxUsers(50)
                .validFrom(LocalDate.now())
                .validTo(LocalDate.now().plusYears(2))
                .adminEmail(ownerEmail)
                .adminFullName("Chủ Đầu Tư Xanh")
                .adminPassword("Password@2026")
                .build();

        var tenantResult = mockMvc.perform(post("/api/v1/platform/tenants")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTenantReq)))
                .andExpect(status().isCreated())
                .andReturn();

        TenantDetailResponse createdTenant = objectMapper.readValue(
                tenantResult.getResponse().getContentAsString(), TenantDetailResponse.class);
        Long tenantId = createdTenant.getId();

        // Kích hoạt tài khoản Owner
        User ownerUser = userRepository.findByEmail(ownerEmail).orElseThrow();
        ownerUser.setMustChangePassword(false);
        userRepository.save(ownerUser);
        String tokenOwner = getAccessToken(ownerEmail);

        // Cập nhật thông tin ngân hàng Napas247 chuẩn vào bảng enterprises
        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId)
                .orElseGet(() -> Enterprise.builder().tenantId(tenantId).build());
        enterprise.setBankBin("970436");
        enterprise.setBankName("Vietcombank");
        enterprise.setBankAccountNo("0123456789");
        enterprise.setBankAccountName("CONG TY NONG NGHIEP XANH");
        enterprise.setTaxNumber("0109998888");
        enterprise.setLegalRepresentative("Chủ Đầu Tư Xanh");
        enterpriseRepository.save(enterprise);

        // ====================================================================
        // KHỐI 1: LUỒNG WS-A (Mặt bằng & Duyệt phân khu 2 tầng)
        // ====================================================================

        // Assert 1.1: Tạo Trang Trại Bắc Ninh để trống code -> Tự sinh mã khớp Regex ^FRM-[0-9]{4}-[0-9]{4}$
        CreateFarmRequest createFarmBNReq = CreateFarmRequest.builder()
                .code(null) // Để trống code
                .name("Trang Trại Bắc Ninh")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("50000.00"))
                .geofenceRadiusM(300)
                .latitude(new BigDecimal("21.1861"))
                .longitude(new BigDecimal("106.0763"))
                .address("Gia Bình, Bắc Ninh")
                .build();

        var farmBNResult = mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createFarmBNReq)))
                .andExpect(status().isCreated())
                .andReturn();

        FarmDetailResponse farmBNDetail = objectMapper.readValue(
                farmBNResult.getResponse().getContentAsString(), FarmDetailResponse.class);
        Long bacNinhId = farmBNDetail.getId();
        String generatedCodeBN = farmBNDetail.getCode();

        assertNotNull(generatedCodeBN, "Mã trang trại tự sinh không được null");
        assertTrue(generatedCodeBN.matches("^FRM-[0-9]{4}-[0-9]{4}$"),
                "Mã trang trại tự sinh phải khớp regex ^FRM-[0-9]{4}-[0-9]{4}$, thực tế: " + generatedCodeBN);

        // Cố tình gọi PUT /api/v1/farms/{id} truyền code = "FRM-HACK-9999" -> Mã trong DB vẫn giữ nguyên (Bất biến)
        UpdateFarmRequest updateFarmBNReq = UpdateFarmRequest.builder()
                .name("Trang Trại Bắc Ninh Cập Nhật")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("50000.00"))
                .geofenceRadiusM(300)
                .latitude(new BigDecimal("21.1861"))
                .longitude(new BigDecimal("106.0763"))
                .address("Gia Bình, Bắc Ninh")
                .build();

        mockMvc.perform(put("/api/v1/farms/{id}", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"FRM-HACK-9999\",\"name\":\"Trang Trại Bắc Ninh Cập Nhật\",\"farmType\":\"CROP\",\"totalAreaM2\":50000,\"geofenceRadiusM\":300}"))
                .andExpect(status().isOk());

        Farm farmBNInDb = farmRepository.findById(bacNinhId).orElseThrow();
        assertEquals(generatedCodeBN, farmBNInDb.getCode(),
                "Mã trang trại phải bất biến, không được phép thay đổi thành mã hack!");

        // Assert 1.1b: Kiểm tra đổi trạng thái trang trại mới qua PATCH /api/v1/farms/{id}/status (Tạm ngưng -> Kích hoạt)
        mockMvc.perform(patch("/api/v1/farms/{id}/status", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        Farm farmBNInactive = farmRepository.findById(bacNinhId).orElseThrow();
        assertEquals("INACTIVE", farmBNInactive.getStatus(), "Trạng thái trang trại Bắc Ninh trong DB phải là INACTIVE");

        mockMvc.perform(patch("/api/v1/farms/{id}/status", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        Farm farmBNActive = farmRepository.findById(bacNinhId).orElseThrow();
        assertEquals("ACTIVE", farmBNActive.getStatus(), "Trạng thái trang trại Bắc Ninh trong DB phải là ACTIVE");

        // Assert 1.1c: Kiểm tra đổi trạng thái Trang trại số 1 qua PATCH /api/v1/farms/1/status
        if (farmRepository.existsById(1L)) {
            String tokenTenant1Owner = getAccessToken("owner");
            mockMvc.perform(patch("/api/v1/farms/1/status")
                            .header("Authorization", "Bearer " + tokenTenant1Owner)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"INACTIVE\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("INACTIVE"));

            Farm farm1Inactive = farmRepository.findById(1L).orElseThrow();
            assertEquals("INACTIVE", farm1Inactive.getStatus(), "Trạng thái trang trại số 1 trong DB phải là INACTIVE");

            mockMvc.perform(patch("/api/v1/farms/1/status")
                            .header("Authorization", "Bearer " + tokenTenant1Owner)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"ACTIVE\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACTIVE"));

            Farm farm1Active = farmRepository.findById(1L).orElseThrow();
            assertEquals("ACTIVE", farm1Active.getStatus(), "Trạng thái trang trại số 1 trong DB phải là ACTIVE");
        }

        // Tạo Trang Trại Đà Lạt (totalAreaM2 = 80000, geofenceRadiusM = 500)
        CreateFarmRequest createFarmDLReq = CreateFarmRequest.builder()
                .code("FRM-DALAT-001")
                .name("Trang Trại Đà Lạt")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("80000.00"))
                .geofenceRadiusM(500)
                .latitude(new BigDecimal("11.9404"))
                .longitude(new BigDecimal("108.4583"))
                .address("Phường 7, TP. Đà Lạt, Lâm Đồng")
                .build();

        var farmDLResult = mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createFarmDLReq)))
                .andExpect(status().isCreated())
                .andReturn();

        FarmDetailResponse farmDLDetail = objectMapper.readValue(
                farmDLResult.getResponse().getContentAsString(), FarmDetailResponse.class);
        Long daLatId = farmDLDetail.getId();

        // Assert 1.2: Tạo 1 Phân khu có areaM2 = 60000 (lớn hơn totalAreaM2 = 50000 của Bắc Ninh) -> Bắt buộc trả về 400 Bad Request!
        CreateProductionZoneRequest overAreaZoneReq = CreateProductionZoneRequest.builder()
                .code("ZONE-BN-OVER")
                .name("Phân Khu Vượt Diện Tích")
                .zoneType("OPEN_FIELD")
                .areaM2(new BigDecimal("60000.00"))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/zones", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overAreaZoneReq)))
                .andExpect(status().isBadRequest());

        // ====================================================================
        // KHỐI 2: LUỒNG WS-B (Bổ nhiệm FARM_MANAGER & Cô lập nhân sự tuyệt đối)
        // ====================================================================

        // Assert 2.1 (Validation thật): Thiếu idCardNumber, thiếu phone, thiếu email hoặc dateOfBirth < 18 tuổi -> Bắt buộc 400 kèm đúng fieldErrors
        CreateEmployeeRequest missingIdCardReq = CreateEmployeeRequest.builder()
                .farmId(bacNinhId)
                .employeeCode("EMP-ERR-001")
                .fullName("Thiếu CCCD")
                .phone("0912345678")
                .email("test1@greenfarm.vn")
                .idCardNumber(null)
                .dateOfBirth(LocalDate.now().minusYears(25))
                .position("FIELD_STAFF")
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .build();

        mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingIdCardReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.idCardNumber").exists());

        CreateEmployeeRequest missingPhoneReq = CreateEmployeeRequest.builder()
                .farmId(bacNinhId)
                .employeeCode("EMP-ERR-002")
                .fullName("Thiếu SĐT")
                .phone(null)
                .email("test2@greenfarm.vn")
                .idCardNumber("001099123456")
                .dateOfBirth(LocalDate.now().minusYears(25))
                .position("FIELD_STAFF")
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .build();

        mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingPhoneReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.phone").exists());

        CreateEmployeeRequest missingEmailReq = CreateEmployeeRequest.builder()
                .farmId(bacNinhId)
                .employeeCode("EMP-ERR-003")
                .fullName("Thiếu Email")
                .phone("0912345678")
                .email(null)
                .idCardNumber("001099123456")
                .dateOfBirth(LocalDate.now().minusYears(25))
                .position("FIELD_STAFF")
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .build();

        mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingEmailReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());

        CreateEmployeeRequest underageReq = CreateEmployeeRequest.builder()
                .farmId(bacNinhId)
                .employeeCode("EMP-ERR-004")
                .fullName("Chưa Đủ 18 Tuổi")
                .phone("0912345678")
                .email("underage@greenfarm.vn")
                .idCardNumber("001099123456")
                .dateOfBirth(LocalDate.now().minusYears(16))
                .position("FIELD_STAFF")
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .build();

        mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(underageReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.dateOfBirth").exists());

        // Assert 2.2 (Bổ nhiệm 1 bước không cần department): Owner bổ nhiệm Giám đốc cho Trang Trại Bắc Ninh
        String managerBnEmail = "manager_bn_" + timestamp + "@greenfarm.vn";
        CreateEmployeeRequest appointMgrReq = CreateEmployeeRequest.builder()
                .farmId(bacNinhId)
                .employeeCode("EMP-BN-MGR")
                .fullName("Nguyễn Văn Quản Lý BN")
                .position("FARM_MANAGER")
                .department(null) // Không gửi department
                .phone("0987654321")
                .email(managerBnEmail)
                .idCardNumber("027088123456")
                .dateOfBirth(LocalDate.of(1988, 6, 15))
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .createAccount(true)
                .initialPassword("Password@2026")
                .build();

        var appointResult = mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointMgrReq)))
                .andExpect(status().isCreated())
                .andReturn();

        EmployeeDetailResponse appointedEmp = objectMapper.readValue(
                appointResult.getResponse().getContentAsString(), EmployeeDetailResponse.class);
        Long managerEmployeeId = appointedEmp.getId();

        // Kiểm tra DB: employees tự động có department = "Ban Quản Lý Trang Trại", user_id != null
        Employee empInDb = employeeRepository.findById(managerEmployeeId).orElseThrow();
        assertEquals("Ban Quản Lý Trang Trại", empInDb.getDepartment(),
                "Phòng ban phải tự động suy diễn thành 'Ban Quản Lý Trang Trại'");
        assertNotNull(empInDb.getUserId(), "user_id của Giám đốc được bổ nhiệm phải khác null");
        Long managerUserId = empInDb.getUserId();

        // Kiểm tra DB: Bảng farms của Bắc Ninh tự động cập nhật manager_user_id = user.id
        Farm updatedFarmBN = farmRepository.findById(bacNinhId).orElseThrow();
        assertEquals(managerUserId, updatedFarmBN.getManagerUserId(),
                "farms.manager_user_id phải khớp với user_id của Giám đốc vừa bổ nhiệm");

        // Kiểm tra DB: user_roles có ROLE_FARM_MANAGER gắn với farm_id = bacNinhId và user_farm_access có bacNinhId
        Role roleFm = roleRepository.findByCode("ROLE_FARM_MANAGER").orElseThrow();
        List<UserRole> userRoles = userRoleRepository.findByUserId(managerUserId);
        boolean hasFmRole = userRoles.stream().anyMatch(ur ->
                ur.getRoleId().equals(roleFm.getId()) && bacNinhId.equals(ur.getFarmId()));
        assertTrue(hasFmRole, "Bảng user_roles phải có ROLE_FARM_MANAGER gắn với farm_id = bacNinhId");
        assertTrue(userFarmAccessRepository.existsByUserIdAndFarmId(managerUserId, bacNinhId),
                "Bảng user_farm_access bắt buộc phải có bacNinhId");

        // Lấy Token của FARM_MANAGER Bắc Ninh
        User managerUser = userRepository.findById(managerUserId).orElseThrow();
        managerUser.setMustChangePassword(false);
        userRepository.save(managerUser);
        String tokenManagerBN = getAccessToken(managerUser.getUsername());

        // Assert 1.2b: Kiểm tra tài khoản nhân sự (FARM_MANAGER) bị cấm đăng nhập khi trang trại bị tạm ngưng
        // Tạm ngưng trang trại Bắc Ninh
        mockMvc.perform(patch("/api/v1/farms/{id}/status", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk());

        // FARM_MANAGER đăng nhập vào trang trại đang bị tạm ngưng -> Bị cấm (HTTP 403 Forbidden) với thông báo "Trang trại đã ngừng hoạt động"
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + managerUser.getUsername() + "\",\"password\":\"Password@2026\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Trang trại đã ngừng hoạt động"));

        // Chủ đầu tư (ROLE_FARM_OWNER) vẫn đăng nhập bình thường
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + ownerEmail + "\",\"password\":\"Password@2026\"}"))
                .andExpect(status().isOk());

        // Kích hoạt lại trang trại Bắc Ninh
        mockMvc.perform(patch("/api/v1/farms/{id}/status", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());

        // Sau khi kích hoạt lại -> FARM_MANAGER đăng nhập thành công (HTTP 200 OK)
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + managerUser.getUsername() + "\",\"password\":\"Password@2026\"}"))
                .andExpect(status().isOk());

        // Assert 1.3: Khi FARM_MANAGER tạo phân khu mới tại Bắc Ninh -> Trạng thái trong DB bắt buộc là 'MAINTENANCE'.
        // Chỉ khi Owner gọi API phê duyệt phân khu đó -> Trạng thái mới chuyển sang 'ACTIVE'.
        CreateProductionZoneRequest zoneProposalReq = CreateProductionZoneRequest.builder()
                .code("ZONE-BN-PROPOSAL")
                .name("Phân Khu Đề Xuất BN")
                .zoneType("OPEN_FIELD")
                .areaM2(new BigDecimal("15000.00"))
                .status("ACTIVE") // FARM_MANAGER cố tình gửi ACTIVE
                .build();

        var zoneProposalResult = mockMvc.perform(post("/api/v1/farms/{farmId}/zones", bacNinhId)
                        .header("Authorization", "Bearer " + tokenManagerBN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zoneProposalReq)))
                .andExpect(status().isCreated())
                .andReturn();

        ProductionZoneResponse proposedZone = objectMapper.readValue(
                zoneProposalResult.getResponse().getContentAsString(), ProductionZoneResponse.class);
        Long proposedZoneId = proposedZone.getId();

        ProductionZone zoneInDb = productionZoneRepository.findById(proposedZoneId).orElseThrow();
        assertEquals("MAINTENANCE", zoneInDb.getStatus(),
                "Phân khu do FARM_MANAGER tạo mới bắt buộc phải ở trạng thái MAINTENANCE (Chờ duyệt)!");

        // Owner gọi API phê duyệt phân khu đó -> Trạng thái mới chuyển sang ACTIVE
        UpdateProductionZoneRequest approveZoneReq = UpdateProductionZoneRequest.builder()
                .name("Phân Khu Đề Xuất BN")
                .zoneType("OPEN_FIELD")
                .areaM2(new BigDecimal("15000.00"))
                .status("ACTIVE")
                .build();

        mockMvc.perform(put("/api/v1/farms/{farmId}/zones/{zoneId}", bacNinhId, proposedZoneId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveZoneReq)))
                .andExpect(status().isOk());

        ProductionZone approvedZoneInDb = productionZoneRepository.findById(proposedZoneId).orElseThrow();
        assertEquals("ACTIVE", approvedZoneInDb.getStatus(),
                "Sau khi Owner phê duyệt, trạng thái phân khu phải chuyển sang ACTIVE!");

        // Assert 2.3 (Cô lập nhân sự giữa 2 trại):
        // Tạo thêm nhân sự "Lê Thị Đà Lạt" thuộc farmId = daLatId
        CreateEmployeeRequest empDaLatReq = CreateEmployeeRequest.builder()
                .farmId(daLatId)
                .employeeCode("EMP-DL-001")
                .fullName("Lê Thị Đà Lạt")
                .position("TECHNICAL_STAFF")
                .phone("0971234567")
                .email("dalat_emp_" + timestamp + "@greenfarm.vn")
                .idCardNumber("049095654321")
                .dateOfBirth(LocalDate.of(1995, 8, 20))
                .joinedDate(LocalDate.now())
                .contractType("FULL_TIME")
                .createAccount(true)
                .initialPassword("Password@2026")
                .build();

        var empDLResult = mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(empDaLatReq)))
                .andExpect(status().isCreated())
                .andReturn();

        EmployeeDetailResponse empDL = objectMapper.readValue(
                empDLResult.getResponse().getContentAsString(), EmployeeDetailResponse.class);
        Long daLatEmployeeId = empDL.getId();
        Long daLatUserId = empDL.getUserId();

        // Khi Owner gọi GET /api/v1/hr/employees?farmId={bacNinhId} -> BẮT BUỘC chỉ có nhân sự Bắc Ninh, assertFalse Lê Thị Đà Lạt!
        var getEmpBNResult = mockMvc.perform(get("/api/v1/hr/employees")
                        .param("farmId", String.valueOf(bacNinhId))
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andReturn();

        String getEmpBNJson = getEmpBNResult.getResponse().getContentAsString();
        JsonNode empNode = objectMapper.readTree(getEmpBNJson);
        for (JsonNode item : empNode.get("content")) {
            assertEquals(bacNinhId.longValue(), item.get("farmId").asLong(),
                    "Danh sách nhân viên khi lọc theo Bắc Ninh chỉ được chứa nhân viên của Bắc Ninh!");
            assertFalse(item.get("fullName").asText().contains("Lê Thị Đà Lạt"),
                    "Danh sách nhân sự Bắc Ninh tuyệt đối không được chứa 'Lê Thị Đà Lạt'!");
        }

        // Khi gọi POST /api/v1/farms/{bacNinhId}/assignments cố tình gán "Lê Thị Đà Lạt" vào phân khu của Bắc Ninh -> Chặn 400 EMPLOYEE_BELONGS_TO_ANOTHER_FARM
        CreateFarmAssignmentRequest crossAssignmentReq = CreateFarmAssignmentRequest.builder()
                .userId(daLatUserId != null ? daLatUserId : daLatEmployeeId)
                .zoneId(proposedZoneId)
                .roleInFarm("TECHNICAL_LEAD")
                .assignedFrom(LocalDate.now())
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/assignments", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossAssignmentReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("EMPLOYEE_BELONGS_TO_ANOTHER_FARM"));

        // ====================================================================
        // KHỐI 3: LUỒNG WS-D (Cô lập Đối tác theo farm_id & Độc quyền Duyệt hạn mức / Khóa đen)
        // ====================================================================

        // Assert 3.1: FARM_MANAGER Bắc Ninh tạo khách hàng "Thương Lái Bắc Ninh" với creditLimit = 200,000,000 -> DB ép về 0.00 và farm_id = bacNinhId
        CreatePartnerRequest createPartnerReq = CreatePartnerRequest.builder()
                .code("PRT-BN-001")
                .name("Thương Lái Bắc Ninh")
                .partnerType("BUYER")
                .farmId(bacNinhId)
                .creditLimit(new BigDecimal("200000000.00")) // Cố tình gửi hạn mức 200 triệu
                .phone("0981112233")
                .email("thuonglai_bn@gmail.com")
                .contactPerson("Trần Văn Lái")
                .build();

        var partnerResult = mockMvc.perform(post("/api/v1/partners")
                        .header("Authorization", "Bearer " + tokenManagerBN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPartnerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        PartnerResponse createdPartner = objectMapper.readValue(
                partnerResult.getResponse().getContentAsString(), PartnerResponse.class);
        Long partnerId = createdPartner.getId();

        Partner partnerInDb = partnerRepository.findById(partnerId).orElseThrow();
        assertEquals(bacNinhId, partnerInDb.getFarmId(), "Đối tác phải được gắn cứng vào farmId = bacNinhId");
        assertEquals(0, BigDecimal.ZERO.compareTo(partnerInDb.getCreditLimit()),
                "credit_limit tạo bởi FARM_MANAGER bắt buộc phải bị ép về 0.00!");

        // Assert 3.2: Khi tài khoản của Trang Trại Đà Lạt gọi GET /api/v1/partners?farmId={daLatId} -> Tuyệt đối không nhìn thấy "Thương Lái Bắc Ninh"
        User daLatUser = userRepository.findById(daLatUserId).orElseThrow();
        daLatUser.setMustChangePassword(false);
        userRepository.save(daLatUser);
        String tokenDaLatEmp = getAccessToken(daLatUser.getUsername());

        var partnersDLResult = mockMvc.perform(get("/api/v1/partners")
                        .param("farmId", String.valueOf(daLatId))
                        .header("Authorization", "Bearer " + tokenDaLatEmp))
                .andExpect(status().isOk())
                .andReturn();

        String partnersDLJson = partnersDLResult.getResponse().getContentAsString();
        assertFalse(partnersDLJson.contains("Thương Lái Bắc Ninh"),
                "Tài khoản của Trang Trại Đà Lạt tuyệt đối không được nhìn thấy 'Thương Lái Bắc Ninh'!");

        // Assert 3.3: Owner gọi PUT /api/v1/partners/{id} nâng creditLimit = 100,000,000 -> DB cập nhật đúng 100,000,000
        UpdatePartnerRequest updatePartnerReq = UpdatePartnerRequest.builder()
                .name("Thương Lái Bắc Ninh")
                .partnerType("BUYER")
                .farmId(bacNinhId)
                .creditLimit(new BigDecimal("100000000.00"))
                .contactPerson("Trần Văn Lái")
                .build();

        mockMvc.perform(put("/api/v1/partners/{id}", partnerId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePartnerReq)))
                .andExpect(status().isOk());

        Partner updatedPartnerInDb = partnerRepository.findById(partnerId).orElseThrow();
        assertEquals(0, new BigDecimal("100000000.00").compareTo(updatedPartnerInDb.getCreditLimit()),
                "Owner nâng hạn mức thành công -> DB phải ghi nhận đúng 100,000,000");

        // Owner chuyển đối tác sang status = 'BLACKLISTED'
        UpdatePartnerStatusRequest blacklistReq = UpdatePartnerStatusRequest.builder()
                .status("BLACKLISTED")
                .build();

        mockMvc.perform(patch("/api/v1/partners/{id}/status", partnerId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blacklistReq)))
                .andExpect(status().isOk());

        Partner blacklistedPartner = partnerRepository.findById(partnerId).orElseThrow();
        assertEquals("BLACKLISTED", blacklistedPartner.getStatus());

        // Thử tạo 1 đơn bán sỉ (POST /api/v1/farms/{bacNinhId}/sales-orders) cho đối tác này phải bị chặn ngay bằng HTTP 400 Bad Request!
        String salesOrderJson = String.format("{\"partnerId\":%d,\"orderDate\":\"%s\",\"items\":[]}",
                partnerId, LocalDate.now());

        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(salesOrderJson))
                .andExpect(status().isBadRequest());

        // ====================================================================
        // KHỐI 4: LUỒNG WS-C & WS-F (Thu hồi khẩn cấp & Tra cứu công khai)
        // ====================================================================

        // Assert 4.2: Tại WS-F, khi có 1 lô thành phẩm đang bán (status = 'SELLING'),
        // Owner gọi POST /api/v1/farms/{bacNinhId}/product-batches/{batchId}/recall -> Chuyển 'RECALLED', public API trả về isRecalled == true!
        String traceCode = "TRACE-BN-" + timestamp;
        ProductBatch sellingBatch = ProductBatch.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .batchCode("BAT-BN-" + timestamp)
                .productName("Cà Chua Beef Xuất Khẩu")
                .qualityGrade("LOẠI 1")
                .initialQuantity(new BigDecimal("1000.00"))
                .remainingQuantity(new BigDecimal("1000.00"))
                .reservedQuantity(BigDecimal.ZERO)
                .unit("KG")
                .status("SELLING")
                .traceabilityCode(traceCode)
                .harvestDate(LocalDate.now().minusDays(3))
                .expiryDate(LocalDate.now().plusDays(25))
                .createdAt(Instant.now())
                .createdBy(ownerUser.getId())
                .build();
        sellingBatch = productBatchRepository.save(sellingBatch);

        // Khởi tạo TraceabilitySnapshot để phục vụ quét mã công khai
        traceabilitySnapshotRepository.save(TraceabilitySnapshot.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .productBatchId(sellingBatch.getId())
                .enterpriseInfoJson("{\"name\":\"CONG TY NONG NGHIEP XANH\"}")
                .farmingTimelineJson("[]")
                .harvestInfoJson("{}")
                .scanCount(0L)
                .snapshotHash("hash-" + timestamp)
                .build());

        RecallProductBatchRequest recallReq = RecallProductBatchRequest.builder()
                .recallReason("Cảnh báo chất lượng")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches/{batchId}/recall", bacNinhId, sellingBatch.getId())
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recallReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECALLED"));

        ProductBatch recalledBatchInDb = productBatchRepository.findById(sellingBatch.getId()).orElseThrow();
        assertEquals("RECALLED", recalledBatchInDb.getStatus(), "Trạng thái lô hàng phải chuyển sang RECALLED");

        // Gọi API công khai GET /api/v1/public/traceability/{traceabilityCode} bắt buộc trả về isRecalled == true
        mockMvc.perform(get("/api/v1/public/traceability/{traceabilityCode}", traceCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRecalled").value(true))
                .andExpect(jsonPath("$.recallReason").value("Cảnh báo chất lượng"));

        // ====================================================================
        // KHỐI 5: LUỒNG WS-H1 & WS-H2 (Thống kê chi phí từng trại & Kết toán chu kỳ)
        // ====================================================================

        // Assert 5.1: Tạo 1 Chu kỳ vận hành (operational_cycles) tại Trang Trại Bắc Ninh
        OperationalCycle cycleBN = OperationalCycle.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .name("Chu Kỳ Vụ Thu Đông BN " + timestamp)
                .fiscalYear(LocalDate.now().getYear())
                .startDate(LocalDate.now().minusMonths(2))
                .endDate(LocalDate.now().plusMonths(1))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(ownerUser.getId())
                .build();
        cycleBN = operationalCycleRepository.save(cycleBN);
        Long cycleId = cycleBN.getId();

        // Tạo Danh mục chi phí cho FarmExpense
        com.farm.saas.modules.masterdata.entity.CostCategory costCat = costCategoryRepository.save(
                com.farm.saas.modules.masterdata.entity.CostCategory.builder()
                        .tenantId(tenantId)
                        .code("CST-EXP-" + timestamp)
                        .name("Chi Phí Vận Hành")
                        .costType("MATERIALS")
                        .createdAt(Instant.now())
                        .build());

        // Tạo 1 đối tác ACTIVE hợp lệ để ghi nhận đơn hàng bán sỉ
        Partner buyerPartner = Partner.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .code("PRT-BUYER-" + timestamp)
                .name("Siêu Thị Co.opmart")
                .partnerType("BUYER")
                .creditLimit(BigDecimal.ZERO)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build();
        buyerPartner = partnerRepository.save(buyerPartner);

        // Đơn hàng bán sỉ đã thu tiền: totalRevenue = 150,000,000 VNĐ
        SalesOrder salesOrder = SalesOrder.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .partnerId(buyerPartner.getId())
                .orderCode("SO-BN-" + timestamp)
                .orderDate(LocalDate.now().minusDays(10))
                .subtotalAmount(new BigDecimal("150000000.00"))
                .discountAmount(BigDecimal.ZERO)
                .vatRate(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("150000000.00"))
                .paidAmount(new BigDecimal("150000000.00"))
                .debtAmount(BigDecimal.ZERO)
                .status("DELIVERED")
                .paymentStatus("PAID")
                .createdAt(Instant.now())
                .build();
        salesOrderRepository.save(salesOrder);

        // Chi phí vật tư + nhân công đã xác nhận (status = 'CONFIRMED'): totalExpense = 90,000,000 VNĐ
        FarmExpense expenseBN = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(bacNinhId)
                .costCategoryId(costCat.getId())
                .expenseCode("EXP-BN-" + timestamp)
                .notes("Chi phí phân bón & công nhân Bắc Ninh")
                .amount(new BigDecimal("90000000.00"))
                .expenseDate(LocalDate.now().minusDays(12))
                .status("CONFIRMED")
                .unitCostEligible(true)
                .expenseSource("GENERAL_EXPENSE")
                .createdAt(Instant.now())
                .build();
        farmExpenseRepository.save(expenseBN);

        // Đồng thời tạo thêm chi phí 50,000,000 VNĐ ở Trang Trại Đà Lạt để bẫy lỗi cộng lẫn giữa 2 trại!
        FarmExpense expenseDL = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(daLatId)
                .costCategoryId(costCat.getId())
                .expenseCode("EXP-DL-" + timestamp)
                .notes("Chi phí vật tư Đà Lạt")
                .amount(new BigDecimal("50000000.00"))
                .expenseDate(LocalDate.now().minusDays(12))
                .status("CONFIRMED")
                .unitCostEligible(true)
                .expenseSource("GENERAL_EXPENSE")
                .createdAt(Instant.now())
                .build();
        farmExpenseRepository.save(expenseDL);

        // Assert 5.2: GET /api/v1/farms/{bacNinhId}/cycles/{cycleId}/settlement-summary
        // Bắt buộc: totalRevenue = 150000000, totalExpense = 90000000 (tuyệt đối không cộng lẫn 50,000,000 của Đà Lạt), netProfit = 60000000
        // ownerVietQrUrl chứa đúng 970436-0123456789 và amount=60000000
        mockMvc.perform(get("/api/v1/farms/{farmId}/cycles/{cycleId}/settlement-summary", bacNinhId, cycleId)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(150000000))
                .andExpect(jsonPath("$.totalExpense").value(90000000))
                .andExpect(jsonPath("$.netProfit").value(60000000))
                .andExpect(jsonPath("$.ownerVietQrUrl").value(Matchers.containsString("970436-0123456789")))
                .andExpect(jsonPath("$.ownerVietQrUrl").value(Matchers.containsString("amount=60000000")));

        // Assert 5.3: Owner gọi POST /api/v1/farms/{bacNinhId}/cycles/{cycleId}/confirm-settlement -> Chuyển sang 'CLOSED'
        mockMvc.perform(post("/api/v1/farms/{farmId}/cycles/{cycleId}/confirm-settlement", bacNinhId, cycleId)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk());

        OperationalCycle closedCycleInDb = operationalCycleRepository.findById(cycleId).orElseThrow();
        assertEquals("CLOSED", closedCycleInDb.getStatus(),
                "Sau khi Owner confirm-settlement, trạng thái chu kỳ trong DB bắt buộc phải chuyển sang CLOSED!");

        // ====================================================================
        // KHỐI 6: KIỂM SOÁT NGÂN SÁCH & DANH MỤC CHI PHÍ (Owner cấp/duyệt ngân sách)
        // ====================================================================
        // Assert 6.1 (Chống hồi quy RBAC 4 Cấp): Owner xem danh mục chi phí (GET /api/v1/cost-categories) không bị 403 Forbidden
        mockMvc.perform(get("/api/v1/cost-categories")
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk());

        // Assert 6.2 (Chống hồi quy RBAC 4 Cấp): Owner tạo/cấp mới ngân sách (POST /api/v1/farms/{farmId}/budgets) không bị 403 Forbidden
        CreateBudgetRequest budgetReq = CreateBudgetRequest.builder()
                .name("Dự toán Ngân Sách Vụ Thu Đông " + timestamp)
                .fiscalYear(LocalDate.now().getYear())
                .totalBudgetAmount(new BigDecimal("200000000.00"))
                .items(List.of(
                        CreateBudgetRequest.BudgetItemRequest.builder()
                                .costCategoryId(costCat.getId())
                                .allocatedAmount(new BigDecimal("200000000.00"))
                                .notes("Khoản mục phân bón và vật tư")
                                .build()
                ))
                .build();

        var budgetResult = mockMvc.perform(post("/api/v1/farms/{farmId}/budgets", bacNinhId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(budgetReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode budgetNode = objectMapper.readTree(budgetResult.getResponse().getContentAsString());
        Long budgetId = budgetNode.get("id").asLong();

        // Assert 6.3: Owner phê duyệt ngân sách chuyển sang ACTIVE
        mockMvc.perform(post("/api/v1/farms/{farmId}/budgets/{id}/approve", bacNinhId, budgetId)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Assert 6.4 (WS-C Chế độ Toàn bộ trang trại): Owner truy vấn stocktakes và transfers không có farmId -> 200 OK
        mockMvc.perform(get("/api/v1/inventory/stocktakes")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/inventory/transfers")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk());
    }
}
