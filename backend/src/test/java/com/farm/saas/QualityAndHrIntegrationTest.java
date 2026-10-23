package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.entity.FarmingLog;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.hr.dto.request.*;
import com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.LeaveRequestRepository;
import com.farm.saas.modules.hr.repository.TimeAttendanceRepository;
import com.farm.saas.modules.masterdata.entity.CropType;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.entity.WorkShift;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.masterdata.repository.WorkShiftRepository;
import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.TraceabilitySnapshotRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class QualityAndHrIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private ProductionZoneRepository zoneRepository;

    @Autowired
    private CropTypeRepository cropTypeRepository;

    @Autowired
    private CropSeasonRepository cropSeasonRepository;

    @Autowired
    private FarmingLogRepository farmingLogRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private TraceabilitySnapshotRepository traceabilitySnapshotRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private WorkShiftRepository workShiftRepository;

    @Autowired
    private TimeAttendanceRepository timeAttendanceRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    private Long farmId;
    private Long warehouseId;
    private CropSeason testSeason;
    private String tokenOwner;
    private String tokenTech;
    private String tokenField;
    private String tokenWarehouse;
    private String tokenAdmin;

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        // 1. Ensure Farm 1 has GPS & Geofence
        Farm farm = farmRepository.findById(1L).orElseGet(() -> farmRepository.save(Farm.builder()
                .tenantId(tenantId)
                .code("FARM_DALAT_01")
                .name("Trang Trại Đà Lạt 01")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("50000.00"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build()));
        farm.setLatitude(new BigDecimal("10.250000"));
        farm.setLongitude(new BigDecimal("105.750000"));
        farm.setGeofenceRadiusM(200);
        farm = farmRepository.save(farm);
        this.farmId = farm.getId();

        // 2. Ensure Warehouse HARVESTED_PRODUCE
        Warehouse wh = warehouseRepository.findByFarmIdAndCode(farmId, "WH_PRODUCE_01")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_PRODUCE_01")
                        .name("Kho Thành Phẩm Nông Sản")
                        .warehouseType("HARVESTED_PRODUCE")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = wh.getId();

        // 3. Ensure Crop Season
        ProductionZone zone = zoneRepository.findByFarmIdAndCode(farmId, "ZONE_QA_01")
                .orElseGet(() -> zoneRepository.save(ProductionZone.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("ZONE_QA_01")
                        .name("Phân Khu Rau Quả Xuất Khẩu")
                        .zoneType("OPEN_FIELD")
                        .areaM2(new BigDecimal("12000.00"))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        CropType cropType = cropTypeRepository.findByTenantIdAndVarietyCode(tenantId, "CROP_BELL_PEPPER_01")
                .orElseGet(() -> cropTypeRepository.save(CropType.builder()
                        .tenantId(tenantId)
                        .varietyCode("CROP_BELL_PEPPER_01")
                        .name("Ớt Chuông Đà Lạt")
                        .growthDaysStandard(75)
                        .createdAt(Instant.now())
                        .build()));

        testSeason = cropSeasonRepository.findByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, "CS-QA-2026-01")
                .orElseGet(() -> cropSeasonRepository.save(CropSeason.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone.getId())
                        .cropTypeId(cropType.getId())
                        .seasonCode("CS-QA-2026-01")
                        .startDate(LocalDate.now().minusDays(50))
                        .plantedAreaM2(new BigDecimal("6000.00"))
                        .status("GROWING")
                        .actualYieldKg(BigDecimal.ZERO)
                        .createdAt(Instant.now())
                        .build()));

        // 4. Generate Tokens
        this.tokenOwner = getAccessToken("owner");
        this.tokenTech = getAccessToken("tech");
        this.tokenField = getAccessToken("staff");
        this.tokenWarehouse = getAccessToken("warehouse");
        this.tokenAdmin = getAccessToken("admin");
    }

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    /**
     * TC-CROP-002: Chốt chặn an toàn sinh học PHI (Pre-Harvest Interval) khi thu hoạch
     */
    @Test
    @DisplayName("TC-CROP-002: Chốt chặn PHI khi thu hoạch - Bị chặn 400 HARVEST_BLOCKED_BY_PHI và thu hoạch hợp lệ sau PHI")
    void testHarvestRecordPhiGuard() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDate phiEnd = today.plusDays(5);

        // 1. Tạo nhật ký canh tác phun thuốc có phi_days = 7, kết thúc cách ly sau 5 ngày nữa
        farmingLogRepository.save(FarmingLog.builder()
                .tenantId(1L)
                .farmId(farmId)
                .seasonId(testSeason.getId())
                .logDate(today.minusDays(2))
                .stage("FRUITING")
                .activityType("PESTICIDE_APPLICATION")
                .phiDays(7)
                .phiEndDate(phiEnd)
                .weatherNotes("Phun thuốc BVTV sinh học diệt trừ rầy xanh")
                .isInventoryBackflushed(false)
                .createdAt(Instant.now())
                .build());

        // 2. Cố tình thu hoạch vào hôm nay (khi chưa hết hạn cách ly phiEnd)
        CreateHarvestRecordRequest blockedReq = CreateHarvestRecordRequest.builder()
                .sourceType("CROP_SEASON")
                .seasonId(testSeason.getId())
                .harvestDate(today)
                .quantity(new BigDecimal("600.00"))
                .unit("KG")
                .qualityGrade("GRADE_A")
                .notes("Thu hoạch sớm phục vụ kiểm thử")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/harvest-records", farmId)
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("HARVEST_BLOCKED_BY_PHI"));

        // 3. Thu hoạch an toàn vào ngày sau khi đã hết hạn PHI (phiEnd.plusDays(1))
        BigDecimal initialYield = testSeason.getActualYieldKg() != null ? testSeason.getActualYieldKg() : BigDecimal.ZERO;
        CreateHarvestRecordRequest validReq = CreateHarvestRecordRequest.builder()
                .sourceType("CROP_SEASON")
                .seasonId(testSeason.getId())
                .harvestDate(phiEnd.plusDays(1))
                .quantity(new BigDecimal("800.00"))
                .unit("KG")
                .qualityGrade("GRADE_A")
                .notes("Thu hoạch chính vụ sau khi kết thúc cách ly an toàn")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/harvest-records", farmId)
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(800.00))
                .andExpect(jsonPath("$.qualityGrade").value("GRADE_A"));

        // Kiểm tra actual_yield_kg của mùa vụ được cộng dồn và chuyển sang HARVESTING
        CropSeason updatedSeason = cropSeasonRepository.findById(testSeason.getId()).orElseThrow();
        assertEquals(initialYield.add(new BigDecimal("800.00")).stripTrailingZeros(),
                updatedSeason.getActualYieldKg().stripTrailingZeros());
        assertEquals("HARVESTING", updatedSeason.getStatus());
    }

    /**
     * TC-SEC-003: Chống tự duyệt KCS Maker-Checker (QC Self-Approval Barrier)
     */
    @Test
    @DisplayName("TC-SEC-003: Chống tự duyệt KCS Maker-Checker - Tech Staff bị chặn 403 & Inspector tự duyệt bị chặn 403")
    void testMakerCheckerSelfApprovalBarrier() throws Exception {
        String batchCode1 = "LOT-MC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Owner tạo lô thành phẩm 1
        CreateProductBatchRequest createReq = CreateProductBatchRequest.builder()
                .batchCode(batchCode1)
                .productName("Ớt Chuông Xuất Khẩu Hộp 5kg")
                .warehouseId(warehouseId)
                .seasonId(testSeason.getId())
                .harvestDate(LocalDate.now())
                .initialQuantity(new BigDecimal("300.00"))
                .unit("KG")
                .qualityGrade("GRADE_A")
                .sources(List.of(
                        CreateProductBatchRequest.ProductBatchSourceItemRequest.builder()
                                .sourceType("CROP_SEASON")
                                .cropSeasonId(testSeason.getId())
                                .contributedQuantity(new BigDecimal("300.00"))
                                .unit("KG")
                                .harvestDate(LocalDate.now())
                                .build()
                ))
                .build();

        var batchRes = mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches", farmId)
                        .header("Authorization", "Bearer " + tokenWarehouse)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode batchJson = objectMapper.readTree(batchRes.getResponse().getContentAsString());
        Long batchId = batchJson.get("id").asLong();

        // 2. Kỹ thuật viên (tech_staff) lập biên bản kiểm định KCS PASSED
        QcInspectionRequest qcReq = QcInspectionRequest.builder()
                .productBatchId(batchId)
                .inspectionCode("QC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .inspectionDate(LocalDate.now())
                .sampleSize(new BigDecimal("5.00"))
                .sampleUnit("KG")
                .overallResult("PASSED")
                .notes("Đạt 100% tiêu chuẩn xuất khẩu")
                .items(List.of(
                        QcInspectionRequest.QcInspectionItemRequest.builder()
                                .parameterName("Dư lượng thuốc BVTV")
                                .standardThreshold("<= 0.01 ppm")
                                .measuredValue("0.00 ppm")
                                .isPassed(true)
                                .build(),
                        QcInspectionRequest.QcInspectionItemRequest.builder()
                                .parameterName("Độ ngọt Brix")
                                .standardThreshold(">= 6.0 Brix")
                                .measuredValue("7.2 Brix")
                                .isPassed(true)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/qc-inspections", farmId)
                        .header("Authorization", "Bearer " + tokenTech)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(qcReq)))
                .andExpect(status().isCreated());

        // Scenario A: Tech Staff cố tình gọi API phê duyệt -> Bị chặn 403 do thiếu quyền PERM_QC_APPROVE
        mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches/{id}/approve", farmId, batchId)
                        .header("Authorization", "Bearer " + tokenTech)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        // Scenario B: Người kiểm định có quyền APPROVE (ví dụ Owner vừa kiểm định vừa duyệt)
        String batchCode2 = "LOT-MC-SELF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        CreateProductBatchRequest createReq2 = CreateProductBatchRequest.builder()
                .batchCode(batchCode2)
                .productName("Ớt Chuông Tiêu Chuẩn")
                .warehouseId(warehouseId)
                .seasonId(testSeason.getId())
                .harvestDate(LocalDate.now())
                .initialQuantity(new BigDecimal("200.00"))
                .unit("KG")
                .qualityGrade("STANDARD")
                .sources(List.of(
                        CreateProductBatchRequest.ProductBatchSourceItemRequest.builder()
                                .sourceType("CROP_SEASON")
                                .cropSeasonId(testSeason.getId())
                                .contributedQuantity(new BigDecimal("200.00"))
                                .unit("KG")
                                .harvestDate(LocalDate.now())
                                .build()
                ))
                .build();

        var batchRes2 = mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches", farmId)
                        .header("Authorization", "Bearer " + tokenWarehouse)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq2)))
                .andExpect(status().isCreated())
                .andReturn();

        Long batchId2 = objectMapper.readTree(batchRes2.getResponse().getContentAsString()).get("id").asLong();

        // Chính Owner (UserId = 2) lập biên bản kiểm tra KCS
        QcInspectionRequest ownerQcReq = QcInspectionRequest.builder()
                .productBatchId(batchId2)
                .inspectionCode("QC-OWNER-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .inspectionDate(LocalDate.now())
                .sampleSize(new BigDecimal("5.00"))
                .sampleUnit("KG")
                .overallResult("PASSED")
                .items(List.of(
                        QcInspectionRequest.QcInspectionItemRequest.builder()
                                .parameterName("Ngoại quan sản phẩm")
                                .standardThreshold("Đạt chuẩn")
                                .measuredValue("Đạt chuẩn")
                                .isPassed(true)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/qc-inspections", farmId)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ownerQcReq)))
                .andExpect(status().isCreated());

        // Inspector (có PERM_QC_APPROVE) cố tình duyệt lô do chính mình kiểm định -> Bị @farmSecurity.canApproveBatch chặn 403 Forbidden!
        mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches/{id}/approve", farmId, batchId2)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    /**
     * TC-QA-001, TC-QA-002 & TC-SYS-005: Phê duyệt KCS, Đóng băng Snapshot, Quét QR công khai & Thu hồi khẩn cấp
     */
    @Test
    @DisplayName("TC-QA-001/002 & TC-SYS-005: Duyệt KCS đóng băng 5 Snapshot, Quét QR công khai & Thu hồi khẩn cấp Cảnh báo Đỏ")
    void testQualityTraceabilityLifecycleAndPublicRecall() throws Exception {
        String batchCode = "LOT-TRC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Tạo lô thành phẩm
        CreateProductBatchRequest batchReq = CreateProductBatchRequest.builder()
                .batchCode(batchCode)
                .productName("Ớt Chuông VietGAP Đà Lạt")
                .warehouseId(warehouseId)
                .seasonId(testSeason.getId())
                .harvestDate(LocalDate.now())
                .initialQuantity(new BigDecimal("500.00"))
                .unit("KG")
                .qualityGrade("GRADE_A")
                .sources(List.of(
                        CreateProductBatchRequest.ProductBatchSourceItemRequest.builder()
                                .sourceType("CROP_SEASON")
                                .cropSeasonId(testSeason.getId())
                                .contributedQuantity(new BigDecimal("500.00"))
                                .unit("KG")
                                .harvestDate(LocalDate.now())
                                .build()
                ))
                .build();

        var bRes = mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches", farmId)
                        .header("Authorization", "Bearer " + tokenWarehouse)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long batchId = objectMapper.readTree(bRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Kỹ thuật viên KCS (tech staff) kiểm định đạt PASSED
        QcInspectionRequest qcReq = QcInspectionRequest.builder()
                .productBatchId(batchId)
                .inspectionCode("QC-TRC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .inspectionDate(LocalDate.now())
                .sampleSize(new BigDecimal("10.00"))
                .sampleUnit("KG")
                .overallResult("PASSED")
                .items(List.of(
                        QcInspectionRequest.QcInspectionItemRequest.builder()
                                .parameterName("Dư lượng Nitrate (NO3)")
                                .standardThreshold("< 50 mg/kg")
                                .measuredValue("15.2 mg/kg")
                                .isPassed(true)
                                .build(),
                        QcInspectionRequest.QcInspectionItemRequest.builder()
                                .parameterName("Khuẩn E.Coli")
                                .standardThreshold("0 CFU/g")
                                .measuredValue("0 CFU/g")
                                .isPassed(true)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/qc-inspections", farmId)
                        .header("Authorization", "Bearer " + tokenTech)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(qcReq)))
                .andExpect(status().isCreated());

        // 3. TC-QA-001: Chủ trang trại độc lập (Owner != Tech) phê duyệt lô hàng
        ApproveProductBatchRequest approveReq = ApproveProductBatchRequest.builder()
                .notes("Đồng ý xuất xưởng đạt chuẩn VietGAP")
                .build();

        var approveRes = mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches/{id}/approve", farmId, batchId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READY_TO_PRINT"))
                .andExpect(jsonPath("$.traceabilityCode").isNotEmpty())
                .andReturn();

        String traceCode = objectMapper.readTree(approveRes.getResponse().getContentAsString())
                .get("traceabilityCode").asText();

        // Kiểm tra bản chụp bất biến traceability_snapshots trong cơ sở dữ liệu
        TraceabilitySnapshot snapshot = traceabilitySnapshotRepository.findByProductBatchId(batchId).orElseThrow();
        assertNotNull(snapshot.getEnterpriseInfoJson(), "enterprise_info_json không được rỗng");
        assertNotNull(snapshot.getVietgapCertJson(), "vietgap_cert_json không được rỗng");
        assertNotNull(snapshot.getFarmingTimelineJson(), "farming_timeline_json không được rỗng");
        assertNotNull(snapshot.getHarvestInfoJson(), "harvest_info_json không được rỗng");
        assertNotNull(snapshot.getQcInspectionJson(), "qc_inspection_json không được rỗng");
        assertNotNull(snapshot.getSnapshotHash(), "snapshot_hash SHA-256 không được rỗng");
        assertEquals(64, snapshot.getSnapshotHash().length(), "Mã băm SHA-256 phải đủ 64 ký tự hex");
        assertEquals(0L, snapshot.getScanCount());

        // 4. TC-QA-002: Người tiêu dùng quét mã QR công khai (KHÔNG CẦN TOKEN ĐĂNG NHẬP)
        mockMvc.perform(get("/api/v1/public/traceability/{traceabilityCode}", traceCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.traceabilityCode").value(traceCode))
                .andExpect(jsonPath("$.productName").value("Ớt Chuông VietGAP Đà Lạt"))
                .andExpect(jsonPath("$.batchStatus").value("READY_TO_PRINT"))
                .andExpect(jsonPath("$.isRecalled").value(false))
                .andExpect(jsonPath("$.scanCount").value(1))
                .andExpect(jsonPath("$.enterprise.enterpriseName").isNotEmpty())
                .andExpect(jsonPath("$.certifications.standardTitle").isNotEmpty())
                .andExpect(jsonPath("$.qcInspection.overallVerdict").value("PASSED"));

        // 5. TC-SYS-005: Thu hồi khẩn cấp (Emergency Recall)
        RecallProductBatchRequest recallReq = RecallProductBatchRequest.builder()
                .recallReason("Phát hiện bao bì rách có nguy cơ nhiễm nấm mốc trong quá trình vận chuyển")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/product-batches/{id}/recall", farmId, batchId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recallReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECALLED"))
                .andExpect(jsonPath("$.recallReason").value(containsString("nhiễm nấm mốc")));

        // Người tiêu dùng quét lại mã QR -> Nhận cảnh báo ĐỎ (isRecalled = true và lý do thu hồi)
        mockMvc.perform(get("/api/v1/public/traceability/{traceabilityCode}", traceCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchStatus").value("RECALLED"))
                .andExpect(jsonPath("$.isRecalled").value(true))
                .andExpect(jsonPath("$.recallReason").value(containsString("nhiễm nấm mốc")))
                .andExpect(jsonPath("$.scanCount").value(2));
    }

    /**
     * TC-HR-001, TC-HR-002 & TC-HR-003: Chấm công GPS Geofence, Giờ công & Nghỉ phép
     */
    @Test
    @DisplayName("TC-HR-001/002/003: Chấm công GPS Geofence 2 đầu, Tính trễ/giờ công & Trừ quỹ phép năm")
    void testHrAttendanceGeofencingAndAnnualLeaveDeduction() throws Exception {
        Long tenantId = 1L;

        // 1. Tạo ca làm việc 07:00 -> 11:30 (ân hạn trễ 15 phút, giải lao 0 phút)
        String shiftCode = "SH-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        WorkShift shift = workShiftRepository.save(WorkShift.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .name("Ca Sáng Trồng Trọt Test")
                .shiftCode(shiftCode)
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(11, 30))
                .graceLateMinutes(15)
                .breakMinutes(0)
                .isOvernight(false)
                .createdAt(Instant.now())
                .build());

        // 2. Tạo nhân viên hợp lệ >= 18 tuổi có quỹ phép năm 12.0 ngày
        String empCode = "EMP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateEmployeeRequest empReq = CreateEmployeeRequest.builder()
                .farmId(farmId)
                .employeeCode(empCode)
                .fullName("Trần Thị Chấm Công")
                .phone("0912345678")
                .email("chamcong@greenfarm.vn")
                .idCardNumber("001096001234")
                .position("FIELD_WORKER")
                .dateOfBirth(LocalDate.of(1996, 8, 15))
                .joinedDate(LocalDate.now().minusMonths(6))
                .contractType("FULL_TIME")
                .baseSalary(new BigDecimal("10000000.00"))
                .hourlyRate(new BigDecimal("50000.00"))
                .annualLeaveQuota(new BigDecimal("12.0"))
                .build();

        var empRes = mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(empReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeCode").value(empCode))
                .andExpect(jsonPath("$.annualLeaveQuota").value(12.0))
                .andReturn();

        Long empId = objectMapper.readTree(empRes.getResponse().getContentAsString()).get("id").asLong();

        // 2b. Kiểm tra quy tắc tuổi lao động < 18 tuổi bị chặn 400 UNDERAGE_EMPLOYEE
        CreateEmployeeRequest underageReq = CreateEmployeeRequest.builder()
                .farmId(farmId)
                .employeeCode("EMP-UNDERAGE-01")
                .fullName("Nguyễn Vị Thành Niên")
                .phone("0987654321")
                .email("underage@greenfarm.vn")
                .idCardNumber("001096005678")
                .position("FIELD_WORKER")
                .dateOfBirth(LocalDate.now().minusYears(16)) // 16 tuổi
                .joinedDate(LocalDate.now())
                .contractType("INTERN")
                .build();

        mockMvc.perform(post("/api/v1/hr/employees")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(underageReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("UNDERAGE_EMPLOYEE"));

        // 3. TC-HR-001: Check-in ở khoảng cách 500m (tâm Farm 1: 10.250000, 105.750000, bán kính 200m)
        // Điểm 10.254500, 105.750000 cách ~500m -> Bị chặn 400 GPS_OUTSIDE_GEOFENCE
        CheckInAttendanceRequest outOfRangeReq = CheckInAttendanceRequest.builder()
                .farmId(farmId)
                .employeeId(empId)
                .shiftId(shift.getId())
                .latitude(new BigDecimal("10.254500"))
                .longitude(new BigDecimal("105.750000"))
                .photoUrl("https://cdn.greenfarm.vn/selfies/checkin_out.jpg")
                .build();

        mockMvc.perform(post("/api/v1/hr/attendance/check-in")
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(outOfRangeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("GPS_OUTSIDE_GEOFENCE"));

        // 4. TC-HR-002: Check-in hợp lệ trong bán kính lúc 07:25 (trễ 10 phút sau 15 phút ân hạn)
        // 2026-10-25T07:25:00+07:00 = 2026-10-25T00:25:00Z
        Instant checkInInstant = Instant.parse("2026-10-25T00:25:00Z");
        CheckInAttendanceRequest validCheckInReq = CheckInAttendanceRequest.builder()
                .farmId(farmId)
                .employeeId(empId)
                .shiftId(shift.getId())
                .latitude(new BigDecimal("10.250000"))
                .longitude(new BigDecimal("105.750000"))
                .photoUrl("https://cdn.greenfarm.vn/selfies/checkin_ok.jpg")
                .checkInTime(checkInInstant)
                .notes("Đến nhận ca muộn do xe hỏng nhẹ")
                .build();

        mockMvc.perform(post("/api/v1/hr/attendance/check-in")
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCheckInReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("LATE"))
                .andExpect(jsonPath("$.lateMinutes").value(10))
                .andExpect(jsonPath("$.isWithinGeofence").value(true));

        // Check-out lúc 11:30 (2026-10-25T11:30:00+07:00 = 2026-10-25T04:30:00Z)
        // Tổng thời gian: 245 phút / 60 = 4.08 giờ
        Instant checkOutInstant = Instant.parse("2026-10-25T04:30:00Z");
        CheckOutAttendanceRequest validCheckOutReq = CheckOutAttendanceRequest.builder()
                .farmId(farmId)
                .employeeId(empId)
                .shiftId(shift.getId())
                .latitude(new BigDecimal("10.250000"))
                .longitude(new BigDecimal("105.750000"))
                .photoUrl("https://cdn.greenfarm.vn/selfies/checkout_ok.jpg")
                .checkOutTime(checkOutInstant)
                .notes("Hoàn thành công việc trong ca")
                .build();

        mockMvc.perform(post("/api/v1/hr/attendance/check-out")
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCheckOutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workingHours").value(4.08))
                .andExpect(jsonPath("$.lateMinutes").value(10))
                .andExpect(jsonPath("$.earlyLeaveMinutes").value(0));

        // 5. TC-HR-003: Đơn nghỉ phép năm 3 ngày & Tự động trừ quỹ phép năm (12.0 -> 9.0)
        CreateLeaveRequest leaveReq = CreateLeaveRequest.builder()
                .farmId(farmId)
                .employeeId(empId)
                .leaveType("ANNUAL_LEAVE")
                .startDate(LocalDate.of(2026, 11, 2))
                .endDate(LocalDate.of(2026, 11, 4))
                .totalDays(new BigDecimal("3.0"))
                .reason("Nghỉ phép thăm gia đình theo kế hoạch")
                .build();

        var leaveRes = mockMvc.perform(post("/api/v1/hr/leaves")
                        .header("Authorization", "Bearer " + tokenField)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(leaveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.leaveType").value("ANNUAL_LEAVE"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        Long leaveId = objectMapper.readTree(leaveRes.getResponse().getContentAsString()).get("id").asLong();

        // Chủ trang trại phê duyệt đơn nghỉ phép
        ApproveLeaveRequest approveLeaveReq = ApproveLeaveRequest.builder()
                .status("APPROVED")
                .build();

        mockMvc.perform(put("/api/v1/hr/leaves/{id}/approve", leaveId)
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveLeaveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Kiểm tra quỹ phép năm trong cơ sở dữ liệu đã giảm chính xác từ 12.0 còn 9.0 ngày
        Employee updatedEmp = employeeRepository.findById(empId).orElseThrow();
        assertEquals(0, new BigDecimal("9.0").compareTo(updatedEmp.getAnnualLeaveQuota()),
                "Quỹ phép năm của nhân viên phải được trừ chính xác còn 9.0 ngày");
    }
}
