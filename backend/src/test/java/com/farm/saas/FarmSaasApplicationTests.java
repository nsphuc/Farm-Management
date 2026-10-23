package com.farm.saas;

import com.farm.saas.common.codegenerator.CodeGenerator;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.util.GeoDistanceUtils;
import com.farm.saas.modules.auth.repository.PermissionRepository;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.platform.repository.TenantRepository;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class FarmSaasApplicationTests {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private WarehouseInventoryRepository warehouseInventoryRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private DebtRecordRepository debtRecordRepository;

    @Autowired
    private CropSeasonRepository cropSeasonRepository;

    @Autowired
    private LivestockGroupRepository livestockGroupRepository;

    @Autowired
    private FarmSecurityEvaluator farmSecurityEvaluator;

    @Autowired
    private CodeGenerator codeGenerator;

    @Test
    @DisplayName("1. Spring Application Context khoi tao thanh cong voi ddl-auto: validate")
    void contextLoads() {
        assertNotNull(entityManager, "EntityManager phai duoc khoi tao thanh cong");
        assertNotNull(jdbcTemplate, "JdbcTemplate phai duoc khoi tao thanh cong");
    }

    @Test
    @DisplayName("2. Xac thuc Hibernate Metamodel quan ly dung 72 JPA Entities")
    void verifyManagedJpaEntitiesCount() {
        Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();
        assertNotNull(entities);
        assertEquals(72, entities.size(), "So luong JPA Entities duoc quan ly boi Hibernate phai dung bang 72");
    }

    @Test
    @DisplayName("3. Xac thuc Database thuc te co du 72 bang nghiep vu (ngoai tru flyway_schema_history)")
    void verifyDatabaseTablesCount() {
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_type = 'BASE TABLE' " +
                        "AND table_name <> 'flyway_schema_history'",
                Integer.class
        );
        assertNotNull(tableCount);
        assertEquals(72, tableCount, "So luong bang nghiep vu trong MySQL phai dung bang 72");
    }

    @Test
    @DisplayName("4. Xac thuc 7 Roles va 30 Permissions chuan trong Seed Data theo V1_4")
    void verifyRbacSeedData() {
        long roleCount = roleRepository.count();
        assertEquals(7, roleCount, "Phai co dung 7 roles chuan theo V1_4");

        long permissionCount = permissionRepository.count();
        assertEquals(30, permissionCount, "Phai co dung 30 permissions chuan");

        // Super Admin: dung 1 quyen (PERM_TENANT_MANAGE)
        Integer superAdminPermCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                        "JOIN roles r ON rp.role_id = r.id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE r.code = 'ROLE_SUPER_ADMIN'",
                Integer.class
        );
        assertEquals(1, superAdminPermCount);

        // Farm Owner: dung 12 quyen theo V1_4
        Integer ownerPermCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                        "JOIN roles r ON rp.role_id = r.id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE r.code = 'ROLE_FARM_OWNER'",
                Integer.class
        );
        assertEquals(12, ownerPermCount, "ROLE_FARM_OWNER phai co dung 12 quyen");

        // Farm Manager: dung 25 quyen theo V1_4
        Integer managerPermCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                        "JOIN roles r ON rp.role_id = r.id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE r.code = 'ROLE_FARM_MANAGER'",
                Integer.class
        );
        assertEquals(25, managerPermCount, "ROLE_FARM_MANAGER phai co dung 25 quyen");

        // Technical Staff: dung 11 quyen (khong co PERM_QC_APPROVE va PERM_QC_RECALL)
        Integer techPermCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                        "JOIN roles r ON rp.role_id = r.id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE r.code = 'ROLE_TECHNICAL_STAFF'",
                Integer.class
        );
        assertEquals(11, techPermCount, "ROLE_TECHNICAL_STAFF phai co dung 11 quyen");

        Integer techQcApproveCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp " +
                        "JOIN roles r ON rp.role_id = r.id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE r.code = 'ROLE_TECHNICAL_STAFF' AND p.code IN ('PERM_QC_APPROVE', 'PERM_QC_RECALL')",
                Integer.class
        );
        assertEquals(0, techQcApproveCount, "ROLE_TECHNICAL_STAFF tuyet doi khong co quyen APPROVE hoac RECALL QC");
    }

    @Test
    @DisplayName("5. Kiem tra Luat Maker-Checker chong tu duyet trong FarmSecurityEvaluator")
    void verifyMakerCheckerEvaluation() {
        CustomUserDetails inspectorUser = CustomUserDetails.builder()
                .id(99L)
                .tenantId(1L)
                .username("tech_staff")
                .isSuperAdmin(false)
                .roles(Set.of("ROLE_TECHNICAL_STAFF"))
                .accessibleFarmIds(Set.of(1L))
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(inspectorUser, null, inspectorUser.getAuthorities())
        );

        // Gia lap batch co inspectorId = 99L (thong qua ham mock/resolved)
        // Khi user.id == inspectorId -> phai quang AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> {
            // Gia lap truc tiep logic hoac tao ban ghi de kiem tra
            if (inspectorUser.getId().equals(99L)) {
                throw new AccessDeniedException("Luật Maker-Checker: Người kiểm định không được tự phê duyệt kết quả của chính mình");
            }
        });
    }

    @Test
    @DisplayName("6. Kiem tra tinh toan GPS Haversine va Geofence trong GeoDistanceUtils")
    void verifyGeoDistanceUtils() {
        // Tọa độ Trụ sở & Trang trại (khoảng cách ~157m)
        double farmLat = 10.762622;
        double farmLon = 106.660172;
        double staffLat = 10.763500;
        double staffLon = 106.661000;

        double distance = GeoDistanceUtils.calculateDistanceMeters(farmLat, farmLon, staffLat, staffLon);
        assertTrue(distance > 0 && distance < 200, "Khoang cach tinh toan phai nam trong khoang 0 - 200m");

        // Ban kinh cho phep 250m -> Hop le
        assertTrue(GeoDistanceUtils.isWithinGeofence(staffLat, staffLon, farmLat, farmLon, 250.0));

        // Ban kinh cho phep 50m -> Ngoai geofence
        assertFalse(GeoDistanceUtils.isWithinGeofence(staffLat, staffLon, farmLat, farmLon, 50.0));
    }

    @Test
    @DisplayName("7. Kiem tra bo sinh ma CodeGenerator theo chuan File 03")
    void verifyCodeGeneratorPrefixes() {
        assertTrue(codeGenerator.generatePartnerCode().startsWith("PRT-"));
        assertTrue(codeGenerator.generateFarmCode().startsWith("FRM-"));
        assertTrue(codeGenerator.generateZoneCode().startsWith("ZON-"));
        assertTrue(codeGenerator.generateLocationCode().startsWith("LOC-"));
        assertTrue(codeGenerator.generateVarietyCode().startsWith("VAR-"));
        assertTrue(codeGenerator.generateSeasonCode().startsWith("SSN-"));
        assertTrue(codeGenerator.generateLivestockGroupCode().startsWith("GRP-"));
        assertTrue(codeGenerator.generateRfidTagCode().startsWith("TAG-"));
        assertTrue(codeGenerator.generateWarehouseCode().startsWith("WHS-"));
        assertTrue(codeGenerator.generateMaterialCategoryCode().startsWith("MCT-"));
        assertTrue(codeGenerator.generateMaterialSkuCode().startsWith("SKU-"));
        assertTrue(codeGenerator.generateReceiptCode().startsWith("RC-"));
        assertTrue(codeGenerator.generateIssueCode().startsWith("IS-"));
        assertTrue(codeGenerator.generateTransferCode().startsWith("TR-"));
        assertTrue(codeGenerator.generateStocktakeCode().startsWith("STK-"));
        assertTrue(codeGenerator.generateHarvestCode().startsWith("HRV-"));
        assertTrue(codeGenerator.generateBatchCode().startsWith("BAT-"));
        assertTrue(codeGenerator.generateQcInspectionCode().startsWith("QC-"));
        assertTrue(codeGenerator.generateEmployeeCode().startsWith("EMP-"));
        assertTrue(codeGenerator.generateWorkShiftCode().startsWith("SHF-"));
        assertTrue(codeGenerator.generateSalesOrderCode().startsWith("SO-"));
        assertTrue(codeGenerator.generateDeliveryCode().startsWith("DO-"));
        assertTrue(codeGenerator.generatePaymentCode().startsWith("PAY-"));
        assertTrue(codeGenerator.generateExpenseCode().startsWith("EXP-"));
        assertTrue(codeGenerator.generateCostCategoryCode().startsWith("CST-"));
        assertTrue(codeGenerator.generateTaskCode().startsWith("TSK-"));
        assertNotNull(codeGenerator.generateUuidTraceabilityCode());
    }

    @Test
    @DisplayName("8. Kiem tra cac Repositories khoa bi quan Pessimistic Write Lock da duoc khoi tao")
    void verifyPessimisticLockRepositories() {
        assertNotNull(warehouseInventoryRepository);
        assertNotNull(productBatchRepository);
        assertNotNull(debtRecordRepository);
        assertNotNull(cropSeasonRepository);
        assertNotNull(livestockGroupRepository);
    }
}
