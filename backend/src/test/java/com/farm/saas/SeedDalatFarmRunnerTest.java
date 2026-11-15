package com.farm.saas;

import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.entity.FarmingLog;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.finance.entity.*;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.geography.entity.*;
import com.farm.saas.modules.geography.repository.*;
import com.farm.saas.modules.hr.entity.*;
import com.farm.saas.modules.hr.repository.*;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.repository.*;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.entity.LivestockIndividual;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.livestock.repository.LivestockIndividualRepository;
import com.farm.saas.modules.masterdata.entity.*;
import com.farm.saas.modules.masterdata.repository.*;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.quality.entity.*;
import com.farm.saas.modules.quality.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@SpringBootTest
@ActiveProfiles("dev")
public class SeedDalatFarmRunnerTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private ProductionZoneRepository zoneRepository;

    @Autowired
    private ZoneLocationRepository zoneLocationRepository;

    @Autowired
    private FarmAssignmentRepository farmAssignmentRepository;

    @Autowired
    private OperationalCycleRepository operationalCycleRepository;

    @Autowired
    private UserFarmAccessRepository userFarmAccessRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private WorkShiftRepository workShiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private TimeAttendanceRepository timeAttendanceRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private OvertimeRequestRepository overtimeRequestRepository;

    @Autowired
    private FarmTaskRepository farmTaskRepository;

    @Autowired
    private FarmTaskAssigneeRepository farmTaskAssigneeRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private CostCategoryRepository costCategoryRepository;

    @Autowired
    private CropTypeRepository cropTypeRepository;

    @Autowired
    private LivestockBreedRepository livestockBreedRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialCategoryRepository materialCategoryRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private WarehouseReceiptRepository receiptRepository;

    @Autowired
    private WarehouseReceiptItemRepository receiptItemRepository;

    @Autowired
    private WarehouseIssueRepository issueRepository;

    @Autowired
    private WarehouseIssueItemRepository issueItemRepository;

    @Autowired
    private CropSeasonRepository cropSeasonRepository;

    @Autowired
    private FarmingLogRepository farmingLogRepository;

    @Autowired
    private LivestockGroupRepository livestockGroupRepository;

    @Autowired
    private LivestockIndividualRepository livestockIndividualRepository;

    @Autowired
    private HarvestRecordRepository harvestRecordRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private QcInspectionRepository qcInspectionRepository;

    @Autowired
    private TraceabilitySnapshotRepository traceabilitySnapshotRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private BudgetLineItemRepository budgetLineItemRepository;

    @Autowired
    private FarmExpenseRepository farmExpenseRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SalesOrderItemRepository salesOrderItemRepository;

    @Autowired
    private SalesDeliveryRepository salesDeliveryRepository;

    @Autowired
    private DebtRecordRepository debtRecordRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Test
    @DisplayName("Nạp đầy đủ 100% dữ liệu mẫu chuẩn thực tế cho Nông Trại Công Nghệ Cao Đà Lạt 1")
    void seedAllModulesForDalatFarm1() {
        System.out.println("====================================================================");
        System.out.println(" BẮT ĐẦU SEED DỮ LIỆU CHUẨN THỰC CHIẾN CHO NÔNG TRẠI ĐÀ LẠT 1 ");
        System.out.println("====================================================================");

        Long tenantId = 1L;
        Long farmId = 1L;

        // ---------------------------------------------------------------------
        // 0. CẬP NHẬT FARM 1 THÔNG TIN TỌA ĐỘ VÀ USER_FARM_ACCESS
        // ---------------------------------------------------------------------
        Farm farm = farmRepository.findById(farmId).orElseThrow(() -> new RuntimeException("Farm 1 not found"));
        farm.setName("Nông Trại Công Nghệ Cao Đà Lạt 1");
        farm.setLatitude(new BigDecimal("11.940400"));
        farm.setLongitude(new BigDecimal("108.458300"));
        farm.setGeofenceRadiusM(500);
        farm.setFarmType("MIXED");
        farm.setTotalAreaM2(new BigDecimal("80000.00"));
        farm.setStatus("ACTIVE");
        farm.setManagerUserId(306L);
        farmRepository.save(farm);
        System.out.println("[OK] Cập nhật tọa độ Đà Lạt (11.9404, 108.4583), Geofence=500m, Status=ACTIVE cho Farm 1");

        // Gán quyền user_farm_access cho tất cả user liên quan
        Long[] userIds = new Long[]{303L, 306L, 307L, 308L, 309L, 310L, 311L};
        for (Long uid : userIds) {
            jdbcTemplate.update("INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id, granted_at) VALUES (?, ?, ?, NOW())",
                    uid, farmId, tenantId);
        }
        System.out.println("[OK] user_farm_access đã cấp đủ cho user 303..311");

        // ---------------------------------------------------------------------
        // 1. WS-A: GEOGRAPHY - PHÂN KHU, VỊ TRÍ CHI TIẾT & PHÂN CÔNG
        // ---------------------------------------------------------------------
        // Zone 1: Nhà màng dưa lưới
        ProductionZone z1 = zoneRepository.findByFarmIdAndCode(farmId, "ZON-2610-6091")
                .orElseGet(() -> zoneRepository.findById(1L).orElseGet(() ->
                        zoneRepository.save(ProductionZone.builder()
                                .tenantId(tenantId).farmId(farmId).code("ZON-2610-6091")
                                .name("Khu Nhà Màng Dưa Lưới A1").zoneType("GREENHOUSE")
                                .areaM2(new BigDecimal("5000.00")).status("ACTIVE").createdAt(Instant.now()).build())));
        z1.setName("Khu Nhà Màng Dưa Lưới A1");
        z1.setZoneType("GREENHOUSE");
        z1.setAreaM2(new BigDecimal("5000.00"));
        z1.setStatus("ACTIVE");
        z1 = zoneRepository.save(z1);

        // Zone 2: Chuồng nuôi heo sinh học
        ProductionZone z2 = zoneRepository.findByFarmIdAndCode(farmId, "ZON-2610-8639")
                .orElseGet(() -> zoneRepository.findById(2L).orElseGet(() ->
                        zoneRepository.save(ProductionZone.builder()
                                .tenantId(tenantId).farmId(farmId).code("ZON-2610-8639")
                                .name("Khu Chuồng Nuôi Heo Sinh Học B1").zoneType("BARN")
                                .areaM2(new BigDecimal("3500.00")).status("ACTIVE").createdAt(Instant.now()).build())));
        z2.setName("Khu Chuồng Nuôi Heo Sinh Học B1");
        z2.setZoneType("BARN");
        z2.setAreaM2(new BigDecimal("3500.00"));
        z2.setStatus("ACTIVE");
        z2 = zoneRepository.save(z2);

        // Zone 3: Nhà kho C1
        ProductionZone z3 = zoneRepository.findByFarmIdAndCode(farmId, "ZON-2610-2399")
                .orElseGet(() -> zoneRepository.findById(3L).orElseGet(() ->
                        zoneRepository.save(ProductionZone.builder()
                                .tenantId(tenantId).farmId(farmId).code("ZON-2610-2399")
                                .name("Nhà Kho & Sơ Chế C1").zoneType("STORAGE")
                                .areaM2(new BigDecimal("1500.00")).status("ACTIVE").createdAt(Instant.now()).build())));
        z3.setName("Nhà Kho & Sơ Chế C1");
        z3.setZoneType("STORAGE");
        z3.setAreaM2(new BigDecimal("1500.00"));
        z3.setStatus("ACTIVE");
        z3 = zoneRepository.save(z3);

        // Zone 4: Vườn Cà Chua Beef A2
        ProductionZone z4 = zoneRepository.findByFarmIdAndCode(farmId, "ZON-2610-9901")
                .orElseGet(() -> zoneRepository.save(ProductionZone.builder()
                        .tenantId(tenantId).farmId(farmId).code("ZON-2610-9901")
                        .name("Khu Nhà Kính Cà Chua Beef A2").zoneType("GREENHOUSE")
                        .areaM2(new BigDecimal("4000.00")).status("ACTIVE").createdAt(Instant.now()).build()));

        final Long zone1Id = z1.getId();
        final Long zone2Id = z2.getId();
        final Long zone3Id = z3.getId();
        final Long zone4Id = z4.getId();

        System.out.println("[OK] Đã thiết lập 4 Phân khu: Zone 1 (Dưa Lưới), Zone 2 (Chuồng Heo), Zone 3 (Kho Sơ Chế), Zone 4 (Cà Chua Beef)");

        // Vị trí chi tiết (Zone Locations: Luống, Ô chuồng, Dãy kệ)
        seedZoneLocation(tenantId, farmId, zone1Id, "L01", "Luống Dưa Lưới L01", "EMPTY", new BigDecimal("1200.00"), 1500);
        seedZoneLocation(tenantId, farmId, zone1Id, "L02", "Luống Dưa Lưới L02", "OCCUPIED", new BigDecimal("1200.00"), 1500);
        seedZoneLocation(tenantId, farmId, zone1Id, "L03", "Luống Dưa Lưới L03", "OCCUPIED", new BigDecimal("1200.00"), 1500);
        seedZoneLocation(tenantId, farmId, zone1Id, "L04", "Luống Dưa Lưới L04", "OCCUPIED", new BigDecimal("1200.00"), 1500);

        seedZoneLocation(tenantId, farmId, zone2Id, "CH-01", "Ô Chuồng Nuôi Heo Thịt Lứa 1", "OCCUPIED", new BigDecimal("500.00"), 25);
        seedZoneLocation(tenantId, farmId, zone2Id, "CH-02", "Ô Chuồng Nuôi Heo Thịt Lứa 2", "OCCUPIED", new BigDecimal("500.00"), 25);
        seedZoneLocation(tenantId, farmId, zone2Id, "CH-03", "Ô Chuồng Cách Ly & Thú Y", "EMPTY", new BigDecimal("200.00"), 10);

        seedZoneLocation(tenantId, farmId, zone3Id, "KE-01", "Dãy Kệ K01 - Kho Phân Bón", "OCCUPIED", new BigDecimal("200.00"), 50);
        seedZoneLocation(tenantId, farmId, zone3Id, "KE-02", "Dãy Kệ K02 - Kho Thùng & Tem QR", "OCCUPIED", new BigDecimal("200.00"), 50);
        seedZoneLocation(tenantId, farmId, zone3Id, "BAN-01", "Khu Vực Bàn Sơ Chế & Đóng Gói", "EMPTY", new BigDecimal("300.00"), 10);

        seedZoneLocation(tenantId, farmId, zone4Id, "T01", "Hàng Cây Cà Chua T01", "OCCUPIED", new BigDecimal("1000.00"), 1200);
        seedZoneLocation(tenantId, farmId, zone4Id, "T02", "Hàng Cây Cà Chua T02", "OCCUPIED", new BigDecimal("1000.00"), 1200);

        // Chu kỳ vận hành (Operational Cycles)
        OperationalCycle cycle = operationalCycleRepository.findByFarmId(farmId).stream()
                .filter(c -> "Chu Kỳ Vụ Thu Đông 2026 - Đà Lạt 1".equals(c.getName()))
                .findFirst()
                .orElseGet(() -> operationalCycleRepository.save(OperationalCycle.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .name("Chu Kỳ Vụ Thu Đông 2026 - Đà Lạt 1")
                        .fiscalYear(2026)
                        .startDate(LocalDate.now().minusMonths(2))
                        .endDate(LocalDate.now().plusMonths(2))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        System.out.println("[OK] Đã tạo Chu Kỳ Vận Hành: " + cycle.getName());

        // Phân công nhân sự Farm & Zone Assignments
        // Zone 1: Trần Văn Tổ Trưởng (User 310, ZONE_MANAGER)
        ensureFarmAssignment(tenantId, farmId, zone1Id, 310L, "ZONE_MANAGER");
        // Zone 1: Nguyễn Văn Công Nhân (User 311, FIELD_WORKER)
        ensureFarmAssignment(tenantId, farmId, zone1Id, 311L, "FIELD_WORKER");
        // Zone 1: Bùi Thị Thời Vụ 1 (Employee 8 -> negative userId -8L)
        ensureFarmAssignment(tenantId, farmId, zone1Id, -8L, "FIELD_WORKER");

        // Zone 2: Đỗ Minh Kỹ Sư (User 307, ZONE_MANAGER / TECHNICAL_LEAD)
        ensureFarmAssignment(tenantId, farmId, zone2Id, 307L, "ZONE_MANAGER");
        // Zone 2: Đặng Văn Thời Vụ 2 (Employee 9 -> negative userId -9L)
        ensureFarmAssignment(tenantId, farmId, zone2Id, -9L, "FIELD_WORKER");

        // Zone 3: Phạm Quốc Thủ Kho (User 308, ZONE_MANAGER / WAREHOUSE_KEEPER)
        ensureFarmAssignment(tenantId, farmId, zone3Id, 308L, "ZONE_MANAGER");

        // Zone 4: Trần Văn Tổ Trưởng (User 310, ZONE_MANAGER)
        ensureFarmAssignment(tenantId, farmId, zone4Id, 310L, "ZONE_MANAGER");

        System.out.println("[OK] Đã phân công đủ Trưởng phân khu cho cả 4 phân khu (Zone 1: Tổ Trưởng, Zone 2: Kỹ Sư, Zone 3: Thủ Kho, Zone 4: Tổ Trưởng)");

        // ---------------------------------------------------------------------
        // 2. MASTER DATA & ĐỐI TÁC PARTNERS & KHO BÃI
        // ---------------------------------------------------------------------
        Partner pSupplierBinhDien = ensurePartner(tenantId, "SUP_BINHDIEN", "Công Ty CP Phân Bón Bình Điền Lâm Đồng", "SUPPLIER", "970415", "VietinBank", "1028889999", "CONG TY PHAN BON BINH DIEN");
        Partner pSupplierCp = ensurePartner(tenantId, "SUP_CP_GROUP", "Công Ty CP Chăn Nuôi C.P. Việt Nam", "SUPPLIER", "970422", "MBBank", "0339999888", "CONG TY CHAN NUOI CP VIET NAM");
        Partner pSupplierSeed = ensurePartner(tenantId, "SUP_RIJK_ZWAAN", "Công Ty TNHH Hạt Giống Rijk Zwaan VN", "SUPPLIER", "970436", "Vietcombank", "0071001234567", "RIJK ZWAAN VIETNAM CO LTD");
        Partner pCustCoopmart = ensurePartner(tenantId, "CUST_COOPMART", "Hệ Thống Siêu Thị Co.opmart Đà Lạt", "CUSTOMER", "970436", "Vietcombank", "0123456789", "SAIGON COOP DA LAT");
        Partner pCustWinmart = ensurePartner(tenantId, "CUST_WINMART", "Chuỗi Cửa Hàng Bách Hóa WinMart+", "CUSTOMER", "970407", "Techcombank", "190333222111", "WINCOMMERCE DA LAT");
        System.out.println("[OK] Đã thiết lập 5 Đối tác thương mại chuẩn (3 NCC + 2 Khách hàng)");

        // Cost Categories
        CostCategory ccSeed = ensureCostCategory(tenantId, "CC_SEED", "Chi phí Hạt giống & Cây giống", "DIRECT_MATERIAL");
        CostCategory ccFert = ensureCostCategory(tenantId, "CC_FERT", "Chi phí Phân bón & Dinh dưỡng", "DIRECT_MATERIAL");
        CostCategory ccFeed = ensureCostCategory(tenantId, "CC_FEED", "Chi phí Thức ăn & Thú y", "DIRECT_MATERIAL");
        CostCategory ccLabor = ensureCostCategory(tenantId, "CC_LABOR", "Chi phí Nhân công chăm sóc", "DIRECT_LABOR");
        CostCategory ccOverhead = ensureCostCategory(tenantId, "CC_OVERHEAD", "Chi phí Điện nước & Vận hành", "OVERHEAD");
        System.out.println("[OK] Đã thiết lập 5 Nhóm Chi Phí Kế Toán");

        // Crop Types
        CropType ctMelon = cropTypeRepository.findByTenantIdAndVarietyCode(tenantId, "CROP_MELON_01")
                .orElseGet(() -> cropTypeRepository.save(CropType.builder()
                        .tenantId(tenantId)
                        .varietyCode("CROP_MELON_01")
                        .name("Dưa Lưới Kim Cô Nương F1")
                        .growthDaysStandard(75)
                        .createdAt(Instant.now())
                        .build()));

        CropType ctTomato = cropTypeRepository.findByTenantIdAndVarietyCode(tenantId, "CROP_BEEF_TOMATO_01")
                .orElseGet(() -> cropTypeRepository.save(CropType.builder()
                        .tenantId(tenantId)
                        .varietyCode("CROP_BEEF_TOMATO_01")
                        .name("Cà Chua Beef Hà Lan")
                        .growthDaysStandard(90)
                        .createdAt(Instant.now())
                        .build()));

        // Livestock Breed
        LivestockBreed lbPig = livestockBreedRepository.findByTenantId(tenantId).stream()
                .filter(b -> "Heo Thịt Landrace x Yorkshire Siêu Nạc".equals(b.getBreedName()))
                .findFirst()
                .orElseGet(() -> livestockBreedRepository.save(LivestockBreed.builder()
                        .tenantId(tenantId)
                        .species("PIG")
                        .breedName("Heo Thịt Landrace x Yorkshire Siêu Nạc")
                        .standardGrowthDays(120)
                        .targetWeightKg(new BigDecimal("100.00"))
                        .createdAt(Instant.now())
                        .build()));

        // Warehouses for Farm 1
        Warehouse whFert = ensureWarehouse(tenantId, farmId, "WH-VT-01", "Kho Vật Tư Nông Nghiệp & Phân Bón", "RAW_MATERIALS");
        Warehouse whProduce = ensureWarehouse(tenantId, farmId, "WH-TP-01", "Kho Thành Phẩm Nông Sản Đóng Gói", "HARVESTED_PRODUCE");
        Warehouse whFeed = ensureWarehouse(tenantId, farmId, "WH-TY-01", "Kho Thức Ăn & Thuốc Thú Y", "RAW_MATERIALS");
        System.out.println("[OK] Đã thiết lập 3 Kho vật lý cho Farm 1");

        // Material Categories
        MaterialCategory catFert = ensureMaterialCategory(tenantId, "CAT_FERT", "Phân Bón & Dinh Dưỡng Cây Trồng");
        MaterialCategory catSeed = ensureMaterialCategory(tenantId, "CAT_SEED", "Hạt Giống Cây Trồng");
        MaterialCategory catFeed = ensureMaterialCategory(tenantId, "CAT_FEED", "Thức Ăn & Dinh Dưỡng Chăn Nuôi");
        MaterialCategory catVet = ensureMaterialCategory(tenantId, "CAT_VET", "Thuốc Thú Y & Vaccine");
        MaterialCategory catPack = ensureMaterialCategory(tenantId, "CAT_PACK", "Bao Bì, RFID & Tem Truy Xuất");

        // Materials
        Material matNpk = ensureMaterial(tenantId, catFert.getId(), "MAT_NPK_YARA", "Phân NPK 20-20-15 YaraMila", "KG", new BigDecimal("25000.00"));
        Material matCanxi = ensureMaterial(tenantId, catFert.getId(), "MAT_CANXI_NITRAT", "Canxi Nitrat Haifa Tưới Nhỏ Giọt", "KG", new BigDecimal("18000.00"));
        Material matSeedMelon = ensureMaterial(tenantId, catSeed.getId(), "MAT_SEED_MELON", "Hạt Giống Dưa Lưới Kim Cô Nương F1", "SEED", new BigDecimal("3500.00"));
        Material matFeedCp = ensureMaterial(tenantId, catFeed.getId(), "MAT_FEED_CP551", "Cám Heo Con Tập Ăn C.P 551", "KG", new BigDecimal("22000.00"));
        Material matVaccine = ensureMaterial(tenantId, catVet.getId(), "MAT_VAC_PRRS", "Vaccine Tai Xanh PRRS Ingelvac", "DOSE", new BigDecimal("45000.00"));
        Material matRfid = ensureMaterial(tenantId, catPack.getId(), "MAT_RFID_TAG", "Thẻ Tai Điện Tử RFID Cho Heo", "PIECE", new BigDecimal("15000.00"));
        Material matBox = ensureMaterial(tenantId, catPack.getId(), "MAT_BOX_5KG", "Thùng Carton Dưa Lưới 5kg VietGAP", "PIECE", new BigDecimal("12000.00"));
        System.out.println("[OK] Đã thiết lập 7 Vật tư chuẩn sản xuất");

        // ---------------------------------------------------------------------
        // 3. WS-B & WS-G: HR, CA LÀM, ĐIỂM DANH CHECK-IN, NGHỈ PHÉP & CÔNG VIỆC
        // ---------------------------------------------------------------------
        WorkShift shiftMorning = ensureWorkShift(tenantId, farmId, "SHF-MORNING", "Ca Sáng Tiêu Chuẩn", LocalTime.of(7, 0), LocalTime.of(11, 30));
        WorkShift shiftAfternoon = ensureWorkShift(tenantId, farmId, "SHF-AFTERNOON", "Ca Chiều Tiêu Chuẩn", LocalTime.of(13, 0), LocalTime.of(17, 30));

        // Shift assignments cho tuần này (Monday -> Sunday)
        List<Employee> allEmployees = employeeRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        LocalDate today = LocalDate.now();
        LocalDate monday = today.minusDays(today.getDayOfWeek().getValue() - 1);
        for (Employee emp : allEmployees) {
            for (int i = 0; i < 6; i++) { // Thứ 2 đến Thứ 7
                LocalDate day = monday.plusDays(i);
                ensureShiftAssignment(tenantId, farmId, emp.getId(), shiftMorning.getId(), day);
            }
        }
        System.out.println("[OK] Đã xếp lịch làm việc Ca Sáng tuần này cho " + allEmployees.size() + " nhân viên");

        // Điểm danh Hôm Nay (Check-in cho nhân viên)
        BigDecimal lat = new BigDecimal("11.940400");
        BigDecimal lon = new BigDecimal("108.458300");
        String photoUrl = "https://res.cloudinary.com/farm-saas/image/upload/v1/attendance/group_checkin.jpg";

        for (Employee emp : allEmployees) {
            // Check-in cho hầu hết nhân viên (trừ nhân viên nghỉ phép)
            if (emp.getId().equals(9L)) {
                // Đặng Văn Thời Vụ 2: Điểm danh hôm nay để có mặt
                seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today,
                        Instant.now().minusSeconds(14400), null, "CHECK_IN", lat, lon, photoUrl, "Có mặt ca sáng");
            } else if (emp.getId().equals(8L)) {
                // Bùi Thị Thời Vụ 1: Điểm danh ca sáng
                seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today,
                        Instant.now().minusSeconds(14400), null, "CHECK_IN", lat, lon, photoUrl, "Có mặt ca sáng");
            } else if (emp.getId().equals(7L)) {
                // Nguyễn Văn Công Nhân: Điểm danh ca sáng
                seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today,
                        Instant.now().minusSeconds(14400), null, "CHECK_IN", lat, lon, photoUrl, "Có mặt ca sáng");
            } else if (emp.getId().equals(6L)) {
                // Trần Văn Tổ Trưởng: Điểm danh ca sáng
                seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today,
                        Instant.now().minusSeconds(14400), null, "CHECK_IN", lat, lon, photoUrl, "Tổ trưởng điểm danh ca sáng");
            } else if (emp.getId().equals(4L) || emp.getId().equals(3L)) {
                // Thủ kho & Kỹ sư
                seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today,
                        Instant.now().minusSeconds(14400), null, "CHECK_IN", lat, lon, photoUrl, "Có mặt đúng giờ");
            }

            // Điểm danh Hôm Qua (Check-in và Check-out đầy đủ)
            seedAttendance(tenantId, farmId, emp.getId(), shiftMorning.getId(), today.minusDays(1),
                    Instant.now().minusSeconds(86400 + 14400), Instant.now().minusSeconds(86400), "CHECK_OUT",
                    lat, lon, photoUrl, "Hoàn thành ca hôm qua");
        }
        System.out.println("[OK] Đã ghi nhận điểm danh Check-in hôm nay & hôm qua với GPS chuẩn Đà Lạt");

        // Đơn Nghỉ Phép: 1 PENDING (chờ duyệt trong WS-G) + 1 APPROVED
        seedLeaveRequest(tenantId, farmId, 7L, today.plusDays(1), today.plusDays(1), "ANNUAL", "PENDING", "Xin nghỉ việc gia đình");
        seedLeaveRequest(tenantId, farmId, 8L, today.minusDays(5), today.minusDays(5), "SICK", "APPROVED", "Nghỉ ốm đã duyệt");

        // Đơn Làm Thêm Giờ OT: 1 PENDING + 1 APPROVED
        seedOvertimeRequest(tenantId, farmId, 7L, today, new BigDecimal("2.0"), "PENDING", "Tăng ca đóng gói dưa lưới xuất Co.opmart");
        seedOvertimeRequest(tenantId, farmId, 8L, today.minusDays(2), new BigDecimal("1.5"), "APPROVED", "Tăng ca chăm sóc tưới bồn");

        // Công việc hiện trường (Farm Tasks) theo từng phân khu
        // Zone 1 Tasks (Nhà màng dưa lưới)
        seedFarmTask(tenantId, farmId, zone1Id, 7L, "Đo nồng độ pH & EC bồn dinh dưỡng tưới nhỏ giọt", "FERTILIZING", "HIGH", "DONE");
        seedFarmTask(tenantId, farmId, zone1Id, 8L, "Tỉa chồi nách và quấn dây treo định vị quả dưa lưới", "MAINTENANCE", "MEDIUM", "IN_PROGRESS");
        seedFarmTask(tenantId, farmId, zone1Id, 7L, "Thu hoạch dưa lưới chín lứa 1 đạt độ Brix > 13.5%", "HARVESTING", "URGENT", "DONE");
        seedFarmTask(tenantId, farmId, zone1Id, 8L, "Kiểm tra bẫy dính vàng và bắt rệp sáp mặt dưới lá", "MAINTENANCE", "LOW", "TODO");

        // Zone 2 Tasks (Chuồng nuôi heo)
        seedFarmTask(tenantId, farmId, zone2Id, 9L, "Rửa sạch máng ăn và cấp cám C.P 551 cho chuồng CH-01", "FEEDING", "HIGH", "DONE");
        seedFarmTask(tenantId, farmId, zone2Id, 3L, "Tiêm phòng định kỳ vaccine tai xanh PRRS đợt 2", "SANITATION", "URGENT", "DONE");
        seedFarmTask(tenantId, farmId, zone2Id, 9L, "Đo thân nhiệt và cân kiểm tra đối trọng 5 cá thể heo", "FEEDING", "MEDIUM", "IN_PROGRESS");
        seedFarmTask(tenantId, farmId, zone2Id, 9L, "Rải vôi bột khử trùng lối đi hành lang chuồng", "SANITATION", "MEDIUM", "TODO");

        // Zone 3 Tasks (Kho bãi & sơ chế)
        seedFarmTask(tenantId, farmId, zone3Id, 4L, "Tiếp nhận 50 bao phân bón YaraMila từ đối tác Bình Điền", "MAINTENANCE", "HIGH", "DONE");
        seedFarmTask(tenantId, farmId, zone3Id, 4L, "Dán tem QR code VietGAP lên 100 thùng dưa lưới thành phẩm", "HARVESTING", "HIGH", "IN_PROGRESS");
        seedFarmTask(tenantId, farmId, zone3Id, 4L, "Kiểm tra nhiệt độ bảo quản buồng mát và độ ẩm kho", "MAINTENANCE", "LOW", "TODO");

        // Zone 4 Tasks (Cà chua beef)
        seedFarmTask(tenantId, farmId, zone4Id, 7L, "Treo dây định hình thân leo cây cà chua beef", "MAINTENANCE", "MEDIUM", "DONE");
        seedFarmTask(tenantId, farmId, zone4Id, 8L, "Châm dung dịch dinh dưỡng tưới cho luống T01-T02", "FERTILIZING", "HIGH", "IN_PROGRESS");

        System.out.println("[OK] Đã tạo 13 công việc Farm Tasks trải dài 4 phân khu (đầy đủ TODO, IN_PROGRESS, DONE)");

        // ---------------------------------------------------------------------
        // 4. WS-C: INVENTORY - PHIẾU NHẬP KHO, PHIẾU XUẤT KHO & TỒN KHO THỰC TẾ
        // ---------------------------------------------------------------------
        // Phiếu nhập 1: Nhập phân bón vào Kho Vật Tư WH-VT-01
        WarehouseReceipt rc1 = ensureReceipt(tenantId, farmId, whFert.getId(), pSupplierBinhDien.getId(), "RC-2026-001",
                "Nhập lô phân bón YaraMila và Canxi Nitrat vụ Thu Đông", "COMPLETED", new BigDecimal("34000000.00"));
        ensureReceiptItem(tenantId, rc1.getId(), matNpk.getId(), new BigDecimal("1000.00"), new BigDecimal("25000.00"), "LOT-NPK-01");
        ensureReceiptItem(tenantId, rc1.getId(), matCanxi.getId(), new BigDecimal("500.00"), new BigDecimal("18000.00"), "LOT-CANXI-01");

        // Cập nhật tồn kho dương cho WH-VT-01
        updateInventory(tenantId, farmId, whFert.getId(), matNpk.getId(), new BigDecimal("950.00"), new BigDecimal("25000.00"), "LOT-NPK-01");
        updateInventory(tenantId, farmId, whFert.getId(), matCanxi.getId(), new BigDecimal("500.00"), new BigDecimal("18000.00"), "LOT-CANXI-01");

        // Phiếu nhập 2: Nhập cám C.P và thẻ tai RFID vào Kho Thú Y WH-TY-01
        WarehouseReceipt rc2 = ensureReceipt(tenantId, farmId, whFeed.getId(), pSupplierCp.getId(), "RC-2026-002",
                "Nhập thức ăn heo con C.P 551 và thẻ tai RFID theo đơn đặt hàng", "COMPLETED", new BigDecimal("45500000.00"));
        ensureReceiptItem(tenantId, rc2.getId(), matFeedCp.getId(), new BigDecimal("2000.00"), new BigDecimal("22000.00"), "LOT-FEED-01");
        ensureReceiptItem(tenantId, rc2.getId(), matRfid.getId(), new BigDecimal("100.00"), new BigDecimal("15000.00"), "LOT-RFID-01");

        updateInventory(tenantId, farmId, whFeed.getId(), matFeedCp.getId(), new BigDecimal("1900.00"), new BigDecimal("22000.00"), "LOT-FEED-01");
        updateInventory(tenantId, farmId, whFeed.getId(), matRfid.getId(), new BigDecimal("95.00"), new BigDecimal("15000.00"), "LOT-RFID-01");

        // Phiếu nhập 3: Nhập thùng carton vào Kho Thành Phẩm WH-TP-01
        WarehouseReceipt rc3 = ensureReceipt(tenantId, farmId, whProduce.getId(), null, "RC-2026-003",
                "Nhập 500 thùng carton dưa lưới 5kg in màu VietGAP", "COMPLETED", new BigDecimal("6000000.00"));
        ensureReceiptItem(tenantId, rc3.getId(), matBox.getId(), new BigDecimal("500.00"), new BigDecimal("12000.00"), "LOT-BOX-01");
        updateInventory(tenantId, farmId, whProduce.getId(), matBox.getId(), new BigDecimal("400.00"), new BigDecimal("12000.00"), "LOT-BOX-01");

        // ---------------------------------------------------------------------
        // 5. WS-E: FARMING OPERATIONS - CROP SEASONS, LIVESTOCK & FARMING LOGS
        // ---------------------------------------------------------------------
        // Crop Season 1: Vụ Dưa Lưới Kim Cô Nương A1
        CropSeason csMelon = cropSeasonRepository.findByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, "CS-2026-DL-01")
                .orElseGet(() -> cropSeasonRepository.save(CropSeason.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone1Id)
                        .cropTypeId(ctMelon.getId())
                        .seasonCode("CS-2026-DL-01")
                        .startDate(LocalDate.now().minusDays(65))
                        .expectedHarvestDate(LocalDate.now().plusDays(10))
                        .plantedAreaM2(new BigDecimal("4500.00"))
                        .status("HARVESTING")
                        .actualYieldKg(new BigDecimal("2500.00"))
                        .estimatedYieldKg(new BigDecimal("8000.00"))
                        .createdAt(Instant.now())
                        .build()));
        csMelon.setStatus("HARVESTING");
        csMelon.setActualYieldKg(new BigDecimal("2500.00"));
        cropSeasonRepository.save(csMelon);

        // Crop Season 2: Vụ Cà Chua Beef A2
        CropSeason csTomato = cropSeasonRepository.findByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, "CS-2026-CB-01")
                .orElseGet(() -> cropSeasonRepository.save(CropSeason.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone4Id)
                        .cropTypeId(ctTomato.getId())
                        .seasonCode("CS-2026-CB-01")
                        .startDate(LocalDate.now().minusDays(30))
                        .expectedHarvestDate(LocalDate.now().plusDays(60))
                        .plantedAreaM2(new BigDecimal("3500.00"))
                        .status("GROWING")
                        .actualYieldKg(BigDecimal.ZERO)
                        .estimatedYieldKg(new BigDecimal("12000.00"))
                        .createdAt(Instant.now())
                        .build()));

        // Livestock Group 1: Đàn heo thịt F1
        LivestockGroup lgPig = livestockGroupRepository.findByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, "LG-2026-HEO-01")
                .orElseGet(() -> livestockGroupRepository.save(LivestockGroup.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone2Id)
                        .operationalCycleId(cycle.getId())
                        .groupCode("LG-2026-HEO-01")
                        .breedId(lbPig.getId())
                        .initialQuantity(50)
                        .currentQuantity(50)
                        .entryDate(LocalDate.now().minusDays(70))
                        .status("RAISING")
                        .createdAt(Instant.now())
                        .build()));

        // 5 Cá thể heo gắn thẻ tai RFID
        seedLivestockIndividual(tenantId, farmId, zone2Id, lgPig.getId(), "RFID-DL-001", "MALE", new BigDecimal("72.50"), "HEALTHY");
        seedLivestockIndividual(tenantId, farmId, zone2Id, lgPig.getId(), "RFID-DL-002", "FEMALE", new BigDecimal("69.00"), "HEALTHY");
        seedLivestockIndividual(tenantId, farmId, zone2Id, lgPig.getId(), "RFID-DL-003", "MALE", new BigDecimal("66.80"), "HEALTHY");
        seedLivestockIndividual(tenantId, farmId, zone2Id, lgPig.getId(), "RFID-DL-004", "FEMALE", new BigDecimal("71.20"), "HEALTHY");
        seedLivestockIndividual(tenantId, farmId, zone2Id, lgPig.getId(), "RFID-DL-005", "MALE", new BigDecimal("64.50"), "MONITORED");

        // Farming Logs (Nhật ký canh tác & chăm sóc)
        seedFarmingLog(tenantId, farmId, csMelon.getId(), 307L, LocalDate.now().minusDays(3),
                "FERTILIZING", "Chạy hệ thống tưới nhỏ giọt 45 phút công thức kali cao nuôi trái ngọt");
        seedFarmingLog(tenantId, farmId, csMelon.getId(), 307L, LocalDate.now().minusDays(1),
                "HARVESTING", "Bắt đầu thu hoạch dưa lưới lứa 1, cắt tỉa cuống hình chữ T chuẩn VietGAP");

        System.out.println("[OK] Đã thiết lập Vụ Dưa Lưới (HARVESTING), Vụ Cà Chua Beef (GROWING), Đàn Heo F1 (50 con có 5 RFID) và Nhật ký canh tác");

        // Phiếu xuất kho: Xuất phân bón ra Zone 1
        WarehouseIssue is1 = ensureIssue(tenantId, farmId, whFert.getId(), csMelon.getId(), null, "ISS-2026-001",
                "Xuất phân bón NPK phục vụ bồn tưới nhỏ giọt Zone A1", "COMPLETED", new BigDecimal("1250000.00"));
        ensureIssueItem(tenantId, is1.getId(), matNpk.getId(), new BigDecimal("50.00"), new BigDecimal("25000.00"), "LOT-NPK-01");

        // Phiếu xuất kho: Xuất cám heo ra Zone 2
        WarehouseIssue is2 = ensureIssue(tenantId, farmId, whFeed.getId(), null, lgPig.getId(), "ISS-2026-002",
                "Xuất 100kg cám heo con C.P 551 cho ô chuồng CH-01", "COMPLETED", new BigDecimal("2200000.00"));
        ensureIssueItem(tenantId, is2.getId(), matFeedCp.getId(), new BigDecimal("100.00"), new BigDecimal("22000.00"), "LOT-FEED-01");

        System.out.println("[OK] Đã tạo 3 Phiếu Nhập Kho COMPLETED, 2 Phiếu Xuất Kho COMPLETED và số dư tồn kho chuẩn xác");

        // ---------------------------------------------------------------------
        // 6. WS-F: QA & TRACEABILITY - THU HOẠCH, LÔ SẢN PHẨM, KCS & TEM QR
        // ---------------------------------------------------------------------
        HarvestRecord hr1 = harvestRecordRepository.findByTenantIdAndFarmIdAndHarvestCode(tenantId, farmId, "HR-2026-001")
                .orElseGet(() -> harvestRecordRepository.save(HarvestRecord.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .harvestCode("HR-2026-001")
                        .harvestDate(LocalDate.now().minusDays(1))
                        .sourceType("CROP_SEASON")
                        .seasonId(csMelon.getId())
                        .quantity(new BigDecimal("2500.00"))
                        .unit("KG")
                        .qualityGrade("GRADE_A")
                        .harvestedByUserId(310L)
                        .notes("Dưa lưới Kim Cô Nương chín đều, lưới nổi đẹp, trọng lượng 1.4 - 1.8kg/trái")
                        .createdAt(Instant.now())
                        .build()));

        // Lô 1: Lô Đã Duyệt KCS & Xuất bán (RELEASED)
        ProductBatch pb1 = productBatchRepository.findByTenantIdAndFarmIdAndBatchCode(tenantId, farmId, "LOT-2026-DL-001")
                .orElseGet(() -> productBatchRepository.save(ProductBatch.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(whProduce.getId())
                        .seasonId(csMelon.getId())
                        .batchCode("LOT-2026-DL-001")
                        .productName("Dưa Lưới Kim Cô Nương Chuẩn VietGAP Đợt 1")
                        .gtinBarcode("8938501234567")
                        .traceabilityCode("TRC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .harvestDate(LocalDate.now().minusDays(1))
                        .expiryDate(LocalDate.now().plusDays(25))
                        .storageConditions("Nơi thoáng mát 15 - 18°C")
                        .initialQuantity(new BigDecimal("2500.00"))
                        .remainingQuantity(new BigDecimal("2000.00"))
                        .reservedQuantity(BigDecimal.ZERO)
                        .unit("KG")
                        .qualityGrade("GRADE_A")
                        .status("RELEASED")
                        .approvedByUserId(306L)
                        .approvedAt(Instant.now().minusSeconds(3600))
                        .createdAt(Instant.now())
                        .build()));

        // Phiếu kiểm định KCS cho Lô 1 (PASSED)
        qcInspectionRepository.findByTenantIdAndFarmIdAndInspectionCode(tenantId, farmId, "QC-2026-001")
                .orElseGet(() -> qcInspectionRepository.save(QcInspection.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .productBatchId(pb1.getId())
                        .inspectionCode("QC-2026-001")
                        .inspectionDate(LocalDate.now().minusDays(1))
                        .inspectorUserId(307L)
                        .sampleSize(new BigDecimal("25.00"))
                        .sampleUnit("KG")
                        .overallResult("PASSED")
                        .notes("Độ ngọt Brix trung bình 13.8%, dư lượng BVTV không phát hiện (0.00ppm), đạt chuẩn VietGAP")
                        .createdAt(Instant.now())
                        .build()));

        // Snapshot truy xuất nguồn gốc
        traceabilitySnapshotRepository.findByProductBatchId(pb1.getId())
                .orElseGet(() -> traceabilitySnapshotRepository.save(TraceabilitySnapshot.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .productBatchId(pb1.getId())
                        .enterpriseInfoJson("{\"company\":\"Hợp Tác Xã Nông Nghiệp CNC Đà Lạt\",\"taxNumber\":\"0108889999\",\"address\":\"Đà Lạt, Lâm Đồng\"}")
                        .vietgapCertJson("{\"certNo\":\"VIETGAP-DL-2026-8899\",\"certBody\":\"Trung Tâm Kiểm Định Chất Lượng Nông Sản\",\"validUntil\":\"2027-12-31\"}")
                        .farmingTimelineJson("[{\"date\":\"2026-08-15\",\"activity\":\"Gieo hạt dưa lưới\"},{\"date\":\"2026-09-01\",\"activity\":\"Tưới dinh dưỡng A/B\"},{\"date\":\"2026-10-28\",\"activity\":\"Thu hoạch lứa 1\"}]")
                        .harvestInfoJson("{\"harvestDate\":\"" + LocalDate.now().minusDays(1) + "\",\"yieldKg\":2500,\"grade\":\"GRADE_A\"}")
                        .qcInspectionJson("{\"brix\":13.8,\"pesticideResidue\":\"0.00ppm\",\"result\":\"PASSED\"}")
                        .snapshotHash(UUID.randomUUID().toString().replace("-", ""))
                        .scanCount(0L)
                        .createdAt(Instant.now())
                        .build()));

        // Lô 2: Lô Đang Chờ Giám Đốc Duyệt (PENDING_APPROVAL - hiển thị trên thẻ WS-G!)
        ProductBatch pb2 = productBatchRepository.findByTenantIdAndFarmIdAndBatchCode(tenantId, farmId, "LOT-2026-DL-002")
                .orElseGet(() -> productBatchRepository.save(ProductBatch.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(whProduce.getId())
                        .seasonId(csMelon.getId())
                        .batchCode("LOT-2026-DL-002")
                        .productName("Dưa Lưới Kim Cô Nương Đợt 2 - Chờ Duyệt KCS")
                        .gtinBarcode("8938501234574")
                        .traceabilityCode("TRC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .harvestDate(LocalDate.now())
                        .expiryDate(LocalDate.now().plusDays(25))
                        .storageConditions("Nơi thoáng mát 15 - 18°C")
                        .initialQuantity(new BigDecimal("1800.00"))
                        .remainingQuantity(new BigDecimal("1800.00"))
                        .reservedQuantity(BigDecimal.ZERO)
                        .unit("KG")
                        .qualityGrade("GRADE_A")
                        .status("PENDING_APPROVAL")
                        .createdAt(Instant.now())
                        .build()));

        System.out.println("[OK] Đã tạo 2 Lô Thành Phẩm: Lô 1 (RELEASED, Passed VietGAP, có QR Code) & Lô 2 (PENDING_APPROVAL để Giám Đốc duyệt)");

        // ---------------------------------------------------------------------
        // 7. WS-H1 & WS-H2: FINANCE - NGÂN SÁCH, CHI PHÍ, ĐƠN BÁN HÀNG & DÒNG TIỀN
        // ---------------------------------------------------------------------
        // Ngân sách vụ mùa
        Budget budget = budgetRepository.findByTenantIdAndFarmIdAndFiscalYearAndName(tenantId, farmId, 2026, "Ngân Sách Vụ Thu Đông Dưa Lưới Kim Cô Nương 2026")
                .orElseGet(() -> budgetRepository.save(Budget.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .operationalCycleId(cycle.getId())
                        .name("Ngân Sách Vụ Thu Đông Dưa Lưới Kim Cô Nương 2026")
                        .fiscalYear(2026)
                        .totalBudgetAmount(new BigDecimal("150000000.00"))
                        .status("APPROVED")
                        .createdAt(Instant.now())
                        .build()));

        seedBudgetLineItem(budget.getId(), ccSeed.getId(), new BigDecimal("15000000.00"), new BigDecimal("14000000.00"), "Hạt giống F1 Rijk Zwaan");
        seedBudgetLineItem(budget.getId(), ccFert.getId(), new BigDecimal("45000000.00"), new BigDecimal("34000000.00"), "Phân bón NPK YaraMila & Canxi Nitrat");
        seedBudgetLineItem(budget.getId(), ccLabor.getId(), new BigDecimal("50000000.00"), new BigDecimal("38000000.00"), "Nhân công chăm sóc hiện trường");
        seedBudgetLineItem(budget.getId(), ccOverhead.getId(), new BigDecimal("40000000.00"), new BigDecimal("25000000.00"), "Điện nước tưới tự động và vật tư");

        // Chi phí thực tế (Farm Expenses)
        seedFarmExpense(tenantId, farmId, ccOverhead.getId(), "EXP-2026-001", "Hóa đơn tiền điện trạm bơm & tưới nhỏ giọt Tháng 10",
                new BigDecimal("5200000.00"), LocalDate.now().minusDays(5), "APPROVED", "BANK_TRANSFER", "Công ty Điện Lực Đà Lạt", csMelon.getId());
        seedFarmExpense(tenantId, farmId, ccLabor.getId(), "EXP-2026-002", "Chi phí bồi dưỡng nhân công bẻ dưa lưới đợt 1",
                new BigDecimal("4800000.00"), LocalDate.now().minusDays(1), "APPROVED", "CASH", "Tổ sản xuất hiện trường A1", csMelon.getId());
        seedFarmExpense(tenantId, farmId, ccOverhead.getId(), "EXP-2026-003", "Mua lưới chắn côn trùng thay thế ô dột mái nhà màng",
                new BigDecimal("2300000.00"), LocalDate.now(), "PENDING", "BANK_TRANSFER", "Cửa hàng vật tư nông nghiệp Đà Lạt", csMelon.getId());

        // Đơn hàng bán (Sales Orders)
        // SO 1: Bán cho Siêu thị Co.opmart (Đã giao hàng và thanh toán đủ 35 triệu)
        SalesOrder so1 = salesOrderRepository.findByTenantIdAndFarmIdAndOrderCode(tenantId, farmId, "SO-2026-001")
                .orElseGet(() -> salesOrderRepository.save(SalesOrder.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .orderCode("SO-2026-001")
                        .partnerId(pCustCoopmart.getId())
                        .orderDate(LocalDate.now().minusDays(1))
                        .deliveryDate(LocalDate.now())
                        .subtotalAmount(new BigDecimal("35000000.00"))
                        .discountAmount(BigDecimal.ZERO)
                        .vatRate(BigDecimal.ZERO)
                        .vatAmount(BigDecimal.ZERO)
                        .finalAmount(new BigDecimal("35000000.00"))
                        .paidAmount(new BigDecimal("35000000.00"))
                        .debtAmount(BigDecimal.ZERO)
                        .status("CONFIRMED")
                        .createdAt(Instant.now())
                        .build()));

        seedSalesOrderItem(so1.getId(), pb1.getId(), "Dưa Lưới Kim Cô Nương Chuẩn VietGAP",
                new BigDecimal("500.00"), new BigDecimal("500.00"), "KG", new BigDecimal("70000.00"), new BigDecimal("35000000.00"));

        // Phiếu xuất giao hàng (Sales Delivery)
        seedSalesDelivery(tenantId, farmId, so1.getId(), "DEL-2026-001", "DELIVERED", "Giao thành công 500kg dưa lưới cho Co.opmart");

        // Giao dịch thanh toán thu tiền từ Co.opmart qua VietQR
        paymentTransactionRepository.findByTenantIdAndFarmIdAndPaymentCode(tenantId, farmId, "PAY-2026-001")
                .orElseGet(() -> paymentTransactionRepository.save(PaymentTransaction.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .partnerId(pCustCoopmart.getId())
                        .salesOrderId(so1.getId())
                        .paymentCode("PAY-2026-001")
                        .paymentType("RECEIPT")
                        .paymentDate(LocalDate.now())
                        .amount(new BigDecimal("35000000.00"))
                        .allocatedAmount(new BigDecimal("35000000.00"))
                        .paymentMethod("BANK_TRANSFER")
                        .referenceCode("NAPAS247_FT2610_88899")
                        .qrTransferContent("Thanh toan tien don hang SO-2026-001")
                        .notes("Thanh toán tiền đơn hàng SO-2026-001 qua VietQR Napas247")
                        .status("COMPLETED")
                        .createdAt(Instant.now())
                        .build()));

        // SO 2: Bán cho WinMart+ (Đơn hàng 21 triệu, trạng thái PENDING)
        SalesOrder so2 = salesOrderRepository.findByTenantIdAndFarmIdAndOrderCode(tenantId, farmId, "SO-2026-002")
                .orElseGet(() -> salesOrderRepository.save(SalesOrder.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .orderCode("SO-2026-002")
                        .partnerId(pCustWinmart.getId())
                        .orderDate(LocalDate.now())
                        .deliveryDate(LocalDate.now().plusDays(2))
                        .subtotalAmount(new BigDecimal("21000000.00"))
                        .discountAmount(BigDecimal.ZERO)
                        .vatRate(BigDecimal.ZERO)
                        .vatAmount(BigDecimal.ZERO)
                        .finalAmount(new BigDecimal("21000000.00"))
                        .paidAmount(BigDecimal.ZERO)
                        .debtAmount(new BigDecimal("21000000.00"))
                        .status("PENDING")
                        .createdAt(Instant.now())
                        .build()));

        seedSalesOrderItem(so2.getId(), pb1.getId(), "Dưa Lưới Kim Cô Nương Chuẩn VietGAP",
                new BigDecimal("300.00"), BigDecimal.ZERO, "KG", new BigDecimal("70000.00"), new BigDecimal("21000000.00"));

        System.out.println("[OK] Đã thiết lập Ngân Sách 150tr, Chi Phí Vận Hành, Đơn Hàng Co.opmart (35tr ĐÃ THU TIỀN) & Đơn Hàng WinMart (21tr)");

        System.out.println("====================================================================");
        System.out.println(" HOÀN TẤT SEED 100% DỮ LIỆU CHUẨN THỰC TẾ CHO NÔNG TRẠI ĐÀ LẠT 1 ");
        System.out.println("====================================================================");
    }

    // -------------------------------------------------------------------------
    // CÁC HÀM TIỆN ÍCH HỖ TRỢ SEED DỮ LIỆU CHUẨN XÁC
    // -------------------------------------------------------------------------
    private void seedZoneLocation(Long tenantId, Long farmId, Long zoneId, String code, String name, String status, BigDecimal area, Integer capacity) {
        boolean exists = zoneLocationRepository.existsByZoneIdAndCode(zoneId, code);
        if (!exists) {
            zoneLocationRepository.save(ZoneLocation.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .zoneId(zoneId)
                    .code(code)
                    .name(name)
                    .status(status)
                    .areaM2(area)
                    .capacity(capacity)
                    .createdAt(Instant.now())
                    .build());
        }
    }

    private void ensureFarmAssignment(Long tenantId, Long farmId, Long zoneId, Long userId, String roleInFarm) {
        List<FarmAssignment> existing = farmAssignmentRepository.findByFarmId(farmId);
        boolean found = existing.stream().anyMatch(a ->
                Boolean.TRUE.equals(a.getIsActive()) &&
                a.getUserId().equals(userId) &&
                a.getRoleInFarm().equals(roleInFarm) &&
                ((zoneId == null && a.getZoneId() == null) || (zoneId != null && zoneId.equals(a.getZoneId())))
        );
        if (!found) {
            farmAssignmentRepository.save(FarmAssignment.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .zoneId(zoneId)
                    .userId(userId)
                    .roleInFarm(roleInFarm)
                    .assignedFrom(LocalDate.now().minusMonths(1))
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build());
        }
    }

    private Partner ensurePartner(Long tenantId, String code, String name, String type, String bin, String bankName, String accNo, String accName) {
        return partnerRepository.findByTenantIdAndCode(tenantId, code)
                .orElseGet(() -> partnerRepository.save(Partner.builder()
                        .tenantId(tenantId)
                        .code(code)
                        .name(name)
                        .partnerType(type)
                        .taxCode("010" + (int)(Math.random() * 9000000 + 1000000))
                        .bankBin(bin)
                        .bankName(bankName)
                        .bankAccountNo(accNo)
                        .bankAccountName(accName)
                        .creditLimit(new BigDecimal("500000000.00"))
                        .paymentTermDays(30)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
    }

    private CostCategory ensureCostCategory(Long tenantId, String code, String name, String type) {
        return costCategoryRepository.findByTenantIdAndCode(tenantId, code)
                .orElseGet(() -> costCategoryRepository.save(CostCategory.builder()
                        .tenantId(tenantId)
                        .code(code)
                        .name(name)
                        .costType(type)
                        .createdAt(Instant.now())
                        .build()));
    }

    private Warehouse ensureWarehouse(Long tenantId, Long farmId, String code, String name, String type) {
        return warehouseRepository.findByFarmIdAndCode(farmId, code)
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code(code)
                        .name(name)
                        .warehouseType(type)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
    }

    private MaterialCategory ensureMaterialCategory(Long tenantId, String code, String name) {
        return materialCategoryRepository.findByTenantIdAndCode(tenantId, code)
                .orElseGet(() -> materialCategoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code(code)
                        .name(name)
                        .createdAt(Instant.now())
                        .build()));
    }

    private Material ensureMaterial(Long tenantId, Long categoryId, String sku, String name, String unit, BigDecimal price) {
        return materialRepository.findByTenantIdAndSkuCode(tenantId, sku)
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(categoryId)
                        .skuCode(sku)
                        .name(name)
                        .standardUnit(unit)
                        .dispatchStrategy("FIFO")
                        .expiryAlertDays(30)
                        .minStockLevel(BigDecimal.TEN)
                        .unitPriceStandard(price)
                        .defaultPhiDays(7)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
    }

    private WorkShift ensureWorkShift(Long tenantId, Long farmId, String code, String name, LocalTime start, LocalTime end) {
        return workShiftRepository.findByTenantId(tenantId).stream()
                .filter(ws -> code.equals(ws.getShiftCode()))
                .findFirst()
                .orElseGet(() -> workShiftRepository.save(WorkShift.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .shiftCode(code)
                        .name(name)
                        .startTime(start)
                        .endTime(end)
                        .breakMinutes(30)
                        .graceLateMinutes(15)
                        .isOvernight(false)
                        .createdAt(Instant.now())
                        .build()));
    }

    private void ensureShiftAssignment(Long tenantId, Long farmId, Long empId, Long shiftId, LocalDate date) {
        boolean exists = shiftAssignmentRepository.findByEmployeeIdAndWorkDateAndShiftId(empId, date, shiftId).isPresent();
        if (!exists) {
            shiftAssignmentRepository.save(ShiftAssignment.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .employeeId(empId)
                    .shiftId(shiftId)
                    .workDate(date)
                    .status("ASSIGNED")
                    .createdAt(Instant.now())
                    .build());
        }
    }

    private void seedAttendance(Long tenantId, Long farmId, Long empId, Long shiftId, LocalDate date,
                                Instant inTime, Instant outTime, String status, BigDecimal lat, BigDecimal lon,
                                String photo, String notes) {
        boolean exists = timeAttendanceRepository.findByEmployeeIdAndWorkDateAndShiftId(empId, date, shiftId).isPresent();
        if (!exists) {
            timeAttendanceRepository.save(TimeAttendance.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .employeeId(empId)
                    .shiftId(shiftId)
                    .workDate(date)
                    .checkInTime(inTime)
                    .checkOutTime(outTime)
                    .status(status)
                    .gpsLatitude(lat)
                    .gpsLongitude(lon)
                    .checkInPhotoUrl(photo)
                    .notes(notes)
                    .createdAt(Instant.now())
                    .build());
        }
    }

    private void seedLeaveRequest(Long tenantId, Long farmId, Long empId, LocalDate from, LocalDate to,
                                  String leaveType, String status, String reason) {
        leaveRequestRepository.save(LeaveRequest.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .employeeId(empId)
                .startDate(from)
                .endDate(to)
                .totalDays(new BigDecimal("1.0"))
                .leaveType(leaveType)
                .reason(reason)
                .status(status)
                .approvedByUserId(status.equals("APPROVED") ? 306L : null)
                .approvedAt(status.equals("APPROVED") ? Instant.now() : null)
                .createdAt(Instant.now())
                .build());
    }

    private void seedOvertimeRequest(Long tenantId, Long farmId, Long empId, LocalDate date,
                                     BigDecimal hours, String status, String reason) {
        overtimeRequestRepository.save(OvertimeRequest.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .employeeId(empId)
                .otDate(date)
                .startTime(LocalTime.of(17, 30))
                .endTime(LocalTime.of(19, 30))
                .totalHours(hours)
                .otMultiplier(new BigDecimal("1.50"))
                .reason(reason)
                .status(status)
                .approvedByUserId(status.equals("APPROVED") ? 306L : null)
                .approvedAt(status.equals("APPROVED") ? Instant.now() : null)
                .createdAt(Instant.now())
                .build());
    }

    private void seedFarmTask(Long tenantId, Long farmId, Long zoneId, Long assignedEmpId,
                              String title, String type, String priority, String status) {
        boolean exists = farmTaskRepository.findAll().stream()
                .anyMatch(t -> farmId.equals(t.getFarmId()) && title.equals(t.getTaskTitle()));
        if (!exists) {
            FarmTask task = farmTaskRepository.save(FarmTask.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .zoneId(zoneId)
                    .assignedToEmployeeId(assignedEmpId)
                    .taskTitle(title)
                    .taskType(type)
                    .priority(priority)
                    .status(status)
                    .deadline(Instant.now().plusSeconds(86400))
                    .createdAt(Instant.now())
                    .build());

            if (assignedEmpId != null) {
                farmTaskAssigneeRepository.save(FarmTaskAssignee.builder()
                        .taskId(task.getId())
                        .tenantId(tenantId)
                        .employeeId(assignedEmpId)
                        .roleInTask("LEADER")
                        .assignedAt(Instant.now())
                        .build());
            }
        }
    }

    private void updateInventory(Long tenantId, Long farmId, Long whId, Long matId, BigDecimal qty, BigDecimal price, String lot) {
        WarehouseInventory inv = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(whId, matId, lot)
                .orElseGet(() -> WarehouseInventory.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(whId)
                        .materialId(matId)
                        .batchNumber(lot)
                        .quantityOnHand(BigDecimal.ZERO)
                        .reservedQuantity(BigDecimal.ZERO)
                        .unitCost(price)
                        .inwardDate(LocalDate.now().minusDays(2))
                        .expiryDate(LocalDate.now().plusMonths(6))
                        .createdAt(Instant.now())
                        .build());
        inv.setQuantityOnHand(qty);
        inventoryRepository.save(inv);
    }

    private WarehouseReceipt ensureReceipt(Long tenantId, Long farmId, Long whId, Long partnerId, String code, String notes, String status, BigDecimal totalAmount) {
        return receiptRepository.findByTenantIdAndFarmIdAndReceiptCode(tenantId, farmId, code)
                .orElseGet(() -> receiptRepository.save(WarehouseReceipt.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(whId)
                        .partnerId(partnerId)
                        .receiptCode(code)
                        .receiptType("PURCHASE")
                        .receiptDate(LocalDate.now().minusDays(2))
                        .totalAmount(totalAmount)
                        .notes(notes)
                        .status(status)
                        .approvedBy(308L)
                        .approvedAt(Instant.now())
                        .createdAt(Instant.now())
                        .build()));
    }

    private void ensureReceiptItem(Long tenantId, Long receiptId, Long matId, BigDecimal qty, BigDecimal price, String lot) {
        receiptItemRepository.save(WarehouseReceiptItem.builder()
                .receiptId(receiptId)
                .tenantId(tenantId)
                .materialId(matId)
                .batchNumber(lot)
                .conversionFactor(BigDecimal.ONE)
                .quantity(qty)
                .unitPrice(price)
                .totalPrice(qty.multiply(price))
                .expiryDate(LocalDate.now().plusMonths(6))
                .createdAt(Instant.now())
                .build());
    }

    private WarehouseIssue ensureIssue(Long tenantId, Long farmId, Long whId, Long seasonId, Long groupId, String code, String notes, String status, BigDecimal totalAmount) {
        return issueRepository.findByTenantIdAndFarmIdAndIssueCode(tenantId, farmId, code)
                .orElseGet(() -> issueRepository.save(WarehouseIssue.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(whId)
                        .seasonId(seasonId)
                        .livestockGroupId(groupId)
                        .issueCode(code)
                        .issueType("INTERNAL_USE")
                        .receiverName("Tổ trưởng hiện trường")
                        .isBackflushed(false)
                        .totalAmount(totalAmount)
                        .issueDate(LocalDate.now().minusDays(1))
                        .notes(notes)
                        .status(status)
                        .approvedBy(308L)
                        .approvedAt(Instant.now())
                        .createdAt(Instant.now())
                        .build()));
    }

    private void ensureIssueItem(Long tenantId, Long issueId, Long matId, BigDecimal qty, BigDecimal price, String lot) {
        issueItemRepository.save(WarehouseIssueItem.builder()
                .issueId(issueId)
                .tenantId(tenantId)
                .materialId(matId)
                .batchNumber(lot)
                .conversionFactor(BigDecimal.ONE)
                .quantity(qty)
                .unitPrice(price)
                .totalPrice(qty.multiply(price))
                .createdAt(Instant.now())
                .build());
    }

    private void seedLivestockIndividual(Long tenantId, Long farmId, Long zoneId, Long groupId, String tag, String gender, BigDecimal weight, String health) {
        livestockIndividualRepository.findByTenantIdAndRfidTagCode(tenantId, tag)
                .orElseGet(() -> livestockIndividualRepository.save(LivestockIndividual.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zoneId)
                        .groupId(groupId)
                        .rfidTagCode(tag)
                        .gender(gender)
                        .birthDate(LocalDate.now().minusDays(90))
                        .currentWeightKg(weight)
                        .healthStatus(health)
                        .createdAt(Instant.now())
                        .build()));
    }

    private void seedFarmingLog(Long tenantId, Long farmId, Long seasonId, Long userId, LocalDate date, String activity, String weatherNotes) {
        farmingLogRepository.save(FarmingLog.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .seasonId(seasonId)
                .performedByUserId(userId)
                .phiDays(0)
                .isInventoryBackflushed(false)
                .logDate(date)
                .activityType(activity)
                .weatherNotes(weatherNotes)
                .createdAt(Instant.now())
                .build());
    }

    private void seedBudgetLineItem(Long budgetId, Long catId, BigDecimal allocated, BigDecimal spent, String notes) {
        budgetLineItemRepository.save(BudgetLineItem.builder()
                .budgetId(budgetId)
                .costCategoryId(catId)
                .allocatedAmount(allocated)
                .spentAmount(spent)
                .notes(notes)
                .createdAt(Instant.now())
                .build());
    }

    private void seedFarmExpense(Long tenantId, Long farmId, Long catId, String code, String notes,
                                 BigDecimal amount, LocalDate date, String status, String method, String recipient, Long seasonId) {
        farmExpenseRepository.findByTenantIdAndFarmIdAndExpenseCode(tenantId, farmId, code)
                .orElseGet(() -> farmExpenseRepository.save(FarmExpense.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .costCategoryId(catId)
                        .expenseCode(code)
                        .expenseSource("OPERATION")
                        .seasonId(seasonId)
                        .expenseDate(date)
                        .amount(amount)
                        .unitCostEligible(true)
                        .paymentMethod(method)
                        .recipientName(recipient)
                        .status(status)
                        .notes(notes)
                        .createdAt(Instant.now())
                        .build()));
    }

    private void seedSalesOrderItem(Long soId, Long batchId, String name, BigDecimal qty, BigDecimal shipped, String unit, BigDecimal price, BigDecimal finalAmount) {
        salesOrderItemRepository.save(SalesOrderItem.builder()
                .salesOrderId(soId)
                .productBatchId(batchId)
                .itemName(name)
                .quantity(qty)
                .shippedQuantity(shipped)
                .unit(unit)
                .unitPrice(price)
                .discountAmount(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(finalAmount)
                .createdAt(Instant.now())
                .build());
    }

    private void seedSalesDelivery(Long tenantId, Long farmId, Long soId, String code, String status, String notes) {
        salesDeliveryRepository.findByTenantIdAndFarmIdAndDeliveryCode(tenantId, farmId, code)
                .orElseGet(() -> salesDeliveryRepository.save(SalesDelivery.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .salesOrderId(soId)
                        .deliveryCode(code)
                        .deliveryDate(LocalDate.now())
                        .driverName("Nguyễn Văn Tài Xế")
                        .vehiclePlate("49C-123.45")
                        .receiverName("Bộ phận giao nhận Co.opmart")
                        .shippingAddress("Phan Đình Phùng, Phường 2, TP. Đà Lạt")
                        .proofOfDeliveryUrl("https://res.cloudinary.com/farm-saas/image/upload/v1/deliveries/pod_dl001.jpg")
                        .notes(notes)
                        .status(status)
                        .createdAt(Instant.now())
                        .build()));
    }
}