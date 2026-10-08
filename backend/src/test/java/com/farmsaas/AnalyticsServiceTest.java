package com.farmsaas;

import com.farmsaas.modules.analytics.dto.*;
import com.farmsaas.modules.analytics.service.AnalyticsService;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class AnalyticsServiceTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private AnalyticsService analyticsService;

    private Long tenantId = 1L;
    private Long farmId;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(tenantId);
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        CreateFarmRequest farmReq = new CreateFarmRequest();
        farmReq.setCode("FARM-BI-" + randomSuffix);
        farmReq.setName("Trang Trại Thử Nghiệm BI " + randomSuffix);
        farmReq.setFarmType("HON_HOP");
        farmReq.setAddress("Đà Lạt, Lâm Đồng");
        farmReq.setTotalAreaM2(new java.math.BigDecimal("15000.00"));
        FarmResponse farm = farmService.createFarm(farmReq);
        farmId = farm.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Kiểm tra Executive Summary Dashboard tính toán chuẩn xác")
    void testGetExecutiveSummary() {
        ExecutiveSummaryDTO summary = analyticsService.getExecutiveSummary(farmId);
        assertNotNull(summary);
        assertNotNull(summary.getTotalRevenue());
        assertNotNull(summary.getTotalExpense());
        assertNotNull(summary.getNetProfit());
        assertNotNull(summary.getRoiPercentage());
        assertNotNull(summary.getMonthlyTrend());
        assertEquals(6, summary.getMonthlyTrend().size());
    }

    @Test
    @DisplayName("Kiểm tra Báo cáo Sản xuất và Năng suất (Production Yield Report)")
    void testGetProductionYieldReport() {
        int year = 2026;
        ProductionYieldReportDTO report = analyticsService.getProductionYieldReport(farmId, year);
        assertNotNull(report);
        assertNotNull(report.getCropYields());
        assertNotNull(report.getFcrSummaries());
        assertNotNull(report.getQualityGrading());
    }

    @Test
    @DisplayName("Kiểm tra Báo cáo Kho & Định Giá Tài Sản (Inventory Report)")
    void testGetInventoryReport() {
        InventoryReportDTO report = analyticsService.getInventoryReport(farmId);
        assertNotNull(report);
        assertNotNull(report.getTotalInventoryValue());
        assertNotNull(report.getCategoryValuations());
        assertNotNull(report.getExpiringItems());
        assertNotNull(report.getLowStockItems());
    }

    @Test
    @DisplayName("Kiểm tra Báo cáo Kết quả Kinh doanh P&L 12 Tháng (Financial PL Report)")
    void testGetFinancialPLReport() {
        int year = 2026;
        FinancialPLReportDTO report = analyticsService.getFinancialPLReport(farmId, year);
        assertNotNull(report);
        assertNotNull(report.getTotalRevenue());
        assertNotNull(report.getTotalExpenses());
        assertNotNull(report.getNetProfit());
        assertNotNull(report.getRoiPercentage());
        assertNotNull(report.getMonthlyPL());
        assertEquals(12, report.getMonthlyPL().size());
    }

    @Test
    @DisplayName("Kiểm tra Trung tâm Cảnh Báo Sớm (Early Alerts Hub)")
    void testGetEarlyAlerts() {
        List<EarlyAlertDTO> alerts = analyticsService.getEarlyAlerts(farmId);
        assertNotNull(alerts);
    }

    @Test
    @DisplayName("Kiểm tra Xuất File Báo Cáo UTF-8 BOM Chuẩn Excel")
    void testExportReportData() throws IOException {
        byte[] csvData = analyticsService.exportReportData(farmId, "financials", "csv");
        assertNotNull(csvData);
        assertTrue(csvData.length > 3);
        // Kiểm tra UTF-8 BOM: 0xEF, 0xBB, 0xBF
        assertEquals((byte) 0xEF, csvData[0]);
        assertEquals((byte) 0xBB, csvData[1]);
        assertEquals((byte) 0xBF, csvData[2]);

        String text = new String(csvData, StandardCharsets.UTF_8);
        assertTrue(text.contains("BÁO CÁO KẾT QUẢ KINH DOANH"));
    }
}
