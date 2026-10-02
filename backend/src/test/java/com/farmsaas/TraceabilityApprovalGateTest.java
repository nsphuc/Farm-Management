package com.farmsaas;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.modules.crop.dto.CropSeasonRequest;
import com.farmsaas.modules.crop.dto.CropSeasonResponse;
import com.farmsaas.modules.crop.dto.CropTypeRequest;
import com.farmsaas.modules.crop.dto.CropTypeResponse;
import com.farmsaas.modules.crop.dto.FarmingLogRequest;
import com.farmsaas.modules.crop.entity.enums.ActivityType;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import com.farmsaas.modules.crop.service.CropSeasonService;
import com.farmsaas.modules.crop.service.CropTypeService;
import com.farmsaas.modules.crop.service.FarmingLogService;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.CreateZoneRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.ZoneResponse;
import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.modules.farm.service.ZoneService;
import com.farmsaas.modules.traceability.dto.*;
import com.farmsaas.modules.traceability.entity.enums.LabelSize;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.entity.enums.QualityGrade;
import com.farmsaas.modules.traceability.service.ProductBatchService;
import com.farmsaas.modules.traceability.service.PublicTraceabilityService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class TraceabilityApprovalGateTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private CropTypeService cropTypeService;

    @Autowired
    private CropSeasonService cropSeasonService;

    @Autowired
    private FarmingLogService farmingLogService;

    @Autowired
    private ProductBatchService productBatchService;

    @Autowired
    private PublicTraceabilityService publicTraceabilityService;

    private Long tenantId = 1L;
    private Long farmId;
    private Long zoneId;
    private Long seasonId;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(tenantId);

        // 1. Tạo farm
        FarmResponse farm = farmService.createFarm(CreateFarmRequest.builder()
                .code("FARM-TRACE-" + System.currentTimeMillis())
                .name("Trang Trại Dưa Lưới Công Nghệ Cao VietGAP")
                .farmType("TRONG_TROT")
                .totalAreaM2(new BigDecimal("30000"))
                .address("Đơn Dương, Lâm Đồng")
                .build());
        farmId = farm.getId();

        // 2. Tạo phân khu
        ZoneResponse zone = zoneService.createZone(farmId, CreateZoneRequest.builder()
                .code("ZONE-GH-" + System.currentTimeMillis())
                .name("Nhà kính VietGAP A2")
                .zoneType("NHA_MANG")
                .areaM2(new BigDecimal("2000.00"))
                .status("ACTIVE")
                .build());
        zoneId = zone.getId();

        // 3. Tạo giống cây
        CropTypeResponse cropType = cropTypeService.createCropType(CropTypeRequest.builder()
                .name("Dưa lưới vàng Fuji")
                .varietyCode("VAR-FUJI-" + System.currentTimeMillis())
                .growthDaysStandard(80)
                .build());

        // 4. Tạo vụ mùa & ghi nhật ký canh tác VietGAP
        CropSeasonResponse season = cropSeasonService.createSeason(farmId, CropSeasonRequest.builder()
                .zoneId(zoneId)
                .cropTypeId(cropType.getId())
                .startDate(LocalDate.now().minusDays(80))
                .expectedHarvestDate(LocalDate.now())
                .plantedAreaM2(new BigDecimal("1500.00"))
                .status(SeasonStatus.THU_HOACH)
                .build());
        seasonId = season.getId();

        farmingLogService.createLog(farmId, seasonId, FarmingLogRequest.builder()
                .stage("Giai đoạn bón thúc nuôi quả")
                .activityType(ActivityType.BON_PHAN)
                .weatherNotes("Nhiệt độ 27°C, độ ẩm 70%")
                .notes("Bón phân hữu cơ sinh học, cách ly 15 ngày trước thu hoạch")
                .build());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Kiểm thử Cổng Phê Duyệt Kiểm Định (Approval Gate), Sinh QR ZXing, Đóng băng Snapshot và Thu hồi khẩn cấp")
    void testApprovalGate_ZXingQr_AndEmergencyRecall() {
        // 1. Thu hoạch và đóng gói lô: Ban đầu phải ở PENDING_APPROVAL, CHƯA có mã QR hay traceabilityCode
        HarvestBatchRequest harvestReq = HarvestBatchRequest.builder()
                .seasonId(seasonId)
                .productName("Dưa lưới ruột cam Fuji VietGAP")
                .harvestDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusDays(20))
                .initialQuantity(new BigDecimal("2000.00"))
                .unit("KG")
                .qualityGrade(QualityGrade.LOAI_1)
                .build();

        ProductBatchResponse pendingBatch = productBatchService.createHarvestBatch(farmId, harvestReq);
        assertNotNull(pendingBatch.getId());
        assertEquals(ProductBatchStatus.PENDING_APPROVAL, pendingBatch.getStatus());
        assertNull(pendingBatch.getTraceabilityCode(), "Lô chưa duyệt tuyệt đối không được có traceabilityCode!");
        assertNull(pendingBatch.getQrImageUrl(), "Lô chưa duyệt tuyệt đối không được sinh mã QR!");

        // 2. Kiểm tra KHÓA IN TEM: Cố tình in tem khi chưa được duyệt -> Phải văng BusinessException
        PrintLabelRequest printReq = PrintLabelRequest.builder()
                .labelSize(LabelSize.SIZE_50X50)
                .printQuantity(50)
                .printerModel("Xprinter XP-350B")
                .build();

        assertThrows(BusinessException.class, () -> {
            productBatchService.recordPrintLog(farmId, pendingBatch.getId(), printReq);
        }, "Hệ thống phải chặn không cho in tem nhiệt khi lô hàng chưa qua cổng kiểm duyệt an toàn!");

        // 3. Phê duyệt kiểm định an toàn (Approval Gate Passed)
        ProductBatchResponse approvedBatch = productBatchService.approveBatch(farmId, pendingBatch.getId());
        assertEquals(ProductBatchStatus.READY_TO_PRINT, approvedBatch.getStatus());
        assertNotNull(approvedBatch.getTraceabilityCode(), "Sau khi duyệt phải sinh mã UUID v4 duy nhất!");
        assertNotNull(approvedBatch.getQrImageUrl(), "Sau khi duyệt phải sinh ảnh Base64 QR bằng Google ZXing!");
        assertTrue(approvedBatch.getQrImageUrl().startsWith("data:image/png;base64,"), "Ảnh QR phải là Data URI Base64!");

        String traceCode = approvedBatch.getTraceabilityCode();

        // 4. In tem nhiệt tập trung tại bàn đóng gói kho trung tâm -> Chuyển trạng thái sang DA_IN_TEM
        LabelPrintLogResponse printLog = productBatchService.recordPrintLog(farmId, approvedBatch.getId(), printReq);
        assertNotNull(printLog.getId());
        assertEquals(50, printLog.getPrintQuantity());

        ProductBatchResponse printedBatch = productBatchService.getBatchById(farmId, approvedBatch.getId());
        assertEquals(ProductBatchStatus.DA_IN_TEM, printedBatch.getStatus());

        // 5. Kiểm thử người tiêu dùng quét mã QR công khai (Zero-Leakage Public Traceability)
        // Xóa tenant context để giả lập request công khai từ Internet không có Header và không có JWT
        TenantContextHolder.clear();

        PublicTraceabilityResponse publicData = publicTraceabilityService.getPublicTraceability(traceCode);
        assertNotNull(publicData);
        assertEquals("Dưa lưới ruột cam Fuji VietGAP", publicData.getProductName());
        assertEquals(QualityGrade.LOAI_1, publicData.getQualityGrade());
        assertFalse(publicData.isRecalled(), "Lô bình thường không được có cờ thu hồi!");
        assertNotNull(publicData.getEnterpriseInfo(), "Snapshot phải có thông tin trang trại/hợp tác xã!");
        assertNotNull(publicData.getVietgapCert(), "Snapshot phải có chứng nhận VietGAP!");
        assertFalse(publicData.getFarmingTimeline().isEmpty(), "Timeline nhật ký canh tác VietGAP phải hiển thị công khai!");

        // 6. Kích hoạt quy trình THU HỒI KHẨN CẤP (Emergency Recall)
        TenantContextHolder.setTenantId(tenantId);
        RecallBatchRequest recallReq = RecallBatchRequest.builder()
                .recallReason("Cảnh báo: Kiểm nghiệm ngẫu nhiên phát hiện chỉ số vi sinh vượt ngưỡng an toàn")
                .build();
        ProductBatchResponse recalledBatch = productBatchService.recallBatch(farmId, approvedBatch.getId(), recallReq);
        assertEquals(ProductBatchStatus.RECALLED, recalledBatch.getStatus());

        // Người tiêu dùng quét lại mã QR -> Banner cảnh báo ĐỎ thu hồi khẩn cấp
        TenantContextHolder.clear();
        PublicTraceabilityResponse recalledPublicData = publicTraceabilityService.getPublicTraceability(traceCode);
        assertTrue(recalledPublicData.isRecalled(), "Trang công khai phải bật cờ thu hồi ngay lập tức khi Farm Owner thu hồi lô!");
        assertNotNull(recalledPublicData.getRecallReason());
        assertTrue(recalledPublicData.getRecallReason().contains("vi sinh vượt ngưỡng"));
    }
}
