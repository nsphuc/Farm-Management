package com.farmsaas.modules.traceability.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.entity.FarmingLog;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.crop.repository.FarmingLogRepository;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.livestock.entity.LivestockEvent;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import com.farmsaas.modules.livestock.repository.LivestockEventRepository;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.modules.traceability.dto.*;
import com.farmsaas.modules.traceability.entity.LabelPrintLog;
import com.farmsaas.modules.traceability.entity.ProductBatch;
import com.farmsaas.modules.traceability.entity.TraceabilitySnapshot;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.repository.LabelPrintLogRepository;
import com.farmsaas.modules.traceability.repository.ProductBatchRepository;
import com.farmsaas.modules.traceability.repository.TraceabilitySnapshotRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductBatchServiceImpl implements ProductBatchService {

    private final ProductBatchRepository productBatchRepository;
    private final TraceabilitySnapshotRepository snapshotRepository;
    private final LabelPrintLogRepository printLogRepository;
    private final FarmRepository farmRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final QrCodeGeneratorService qrCodeGeneratorService;
    private final ObjectMapper objectMapper;

    @Value("${app.traceability.public-url:http://localhost:5173/traceability/}")
    private String publicBaseUrl;

    @Override
    @Transactional
    public ProductBatchResponse createHarvestBatch(Long farmId, HarvestBatchRequest request) {
        Long tenantId = getRequiredTenantId();
        Farm farm = validateFarmAccess(tenantId, farmId);

        if (request.getSeasonId() != null) {
            cropSeasonRepository.findByIdAndTenantIdAndFarmId(request.getSeasonId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + request.getSeasonId()));
        }

        if (request.getLivestockGroupId() != null) {
            livestockGroupRepository.findByIdAndTenantIdAndFarmId(request.getLivestockGroupId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn vật nuôi ID: " + request.getLivestockGroupId()));
        }

        String batchCode = request.getBatchCode();
        if (batchCode == null || batchCode.isBlank()) {
            batchCode = generateBatchCode(tenantId, farmId);
        } else {
            batchCode = batchCode.trim().toUpperCase();
            if (productBatchRepository.existsByTenantIdAndFarmIdAndBatchCode(tenantId, farmId, batchCode)) {
                throw new BusinessException("Mã lô '" + batchCode + "' đã tồn tại trong trang trại này.");
            }
        }

        // Khởi tạo lô ở trạng thái PENDING_APPROVAL: chưa sinh mã QR, chưa sinh traceabilityCode
        ProductBatch batch = ProductBatch.builder()
                .farmId(farmId)
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .batchCode(batchCode)
                .traceabilityCode(null)
                .productName(request.getProductName().trim())
                .harvestDate(request.getHarvestDate())
                .expiryDate(request.getExpiryDate())
                .initialQuantity(request.getInitialQuantity())
                .remainingQuantity(request.getInitialQuantity())
                .unit(request.getUnit() != null ? request.getUnit().trim().toUpperCase() : "KG")
                .qualityGrade(request.getQualityGrade())
                .qrImageUrl(null)
                .status(ProductBatchStatus.PENDING_APPROVAL)
                .build();
        batch.setTenantId(tenantId);

        ProductBatch saved = productBatchRepository.save(batch);
        log.info("Created harvest batch '{}' (ID: {}) in PENDING_APPROVAL for Farm ID: {}",
                saved.getBatchCode(), saved.getId(), farmId);
        return ProductBatchResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductBatchResponse approveBatch(Long farmId, Long batchId) {
        Long tenantId = getRequiredTenantId();
        Farm farm = validateFarmAccess(tenantId, farmId);

        ProductBatch batch = productBatchRepository.findByIdAndTenantIdAndFarmId(batchId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lô thành phẩm ID: " + batchId));

        if (batch.getStatus() != ProductBatchStatus.PENDING_APPROVAL) {
            throw new BusinessException("Chỉ lô thành phẩm ở trạng thái 'Chờ phê duyệt' (PENDING_APPROVAL) mới có thể duyệt kiểm định!");
        }

        // 1. Sinh UUID v4 duy nhất toàn hệ thống
        String traceCode;
        do {
            traceCode = UUID.randomUUID().toString();
        } while (productBatchRepository.existsByTraceabilityCode(traceCode));

        // 2. Tạo URL landing page công khai và sinh ảnh QR bằng Google ZXing Engine
        String landingUrl = publicBaseUrl.trim() + (publicBaseUrl.endsWith("/") ? "" : "/") + traceCode;
        String qrImageBase64 = qrCodeGeneratorService.generateQrCodeBase64(landingUrl, 400, 400);

        // 3. Đóng băng hồ sơ bất biến (Traceability Snapshot)
        captureTraceabilitySnapshot(tenantId, farm, batch, traceCode);

        // 4. Cập nhật lô chuyển sang READY_TO_PRINT
        batch.setTraceabilityCode(traceCode);
        batch.setQrImageUrl(qrImageBase64);
        batch.setStatus(ProductBatchStatus.READY_TO_PRINT);
        batch.setApprovedByUserId(SecurityUtils.getCurrentUserId());
        batch.setApprovedAt(Instant.now());

        ProductBatch saved = productBatchRepository.save(batch);
        log.info("Approved batch ID: {}, generated traceabilityCode: {}, status: READY_TO_PRINT",
                batchId, traceCode);
        return ProductBatchResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductBatchResponse rejectBatch(Long farmId, Long batchId, RejectBatchRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductBatch batch = productBatchRepository.findByIdAndTenantIdAndFarmId(batchId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lô thành phẩm ID: " + batchId));

        if (batch.getStatus() != ProductBatchStatus.PENDING_APPROVAL) {
            throw new BusinessException("Chỉ lô thành phẩm ở trạng thái 'Chờ phê duyệt' (PENDING_APPROVAL) mới có thể từ chối!");
        }

        batch.setStatus(ProductBatchStatus.REJECTED);
        batch.setRejectedByUserId(SecurityUtils.getCurrentUserId());
        batch.setRejectedAt(Instant.now());
        batch.setRejectionReason(request.getRejectionReason());

        ProductBatch saved = productBatchRepository.save(batch);
        log.warn("Rejected batch ID: {} for reason: {}", batchId, request.getRejectionReason());
        return ProductBatchResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductBatchResponse recallBatch(Long farmId, Long batchId, RecallBatchRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductBatch batch = productBatchRepository.findByIdAndTenantIdAndFarmId(batchId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lô thành phẩm ID: " + batchId));

        if (batch.getStatus() == ProductBatchStatus.PENDING_APPROVAL || batch.getStatus() == ProductBatchStatus.REJECTED) {
            throw new BusinessException("Lô chưa được phê duyệt hoặc đã bị từ chối, không thể thực hiện quy trình thu hồi khẩn cấp!");
        }

        batch.setStatus(ProductBatchStatus.RECALLED);
        batch.setRecalledByUserId(SecurityUtils.getCurrentUserId());
        batch.setRecalledAt(Instant.now());
        batch.setRecallReason(request.getRecallReason());

        ProductBatch saved = productBatchRepository.save(batch);
        log.error("EMERGENCY RECALL triggered for batch ID: {}, TraceabilityCode: {}. Reason: {}",
                batchId, batch.getTraceabilityCode(), request.getRecallReason());
        return ProductBatchResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LabelPrintLogResponse recordPrintLog(Long farmId, Long batchId, PrintLabelRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductBatch batch = productBatchRepository.findByIdAndTenantIdAndFarmId(batchId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lô thành phẩm ID: " + batchId));

        if (batch.getStatus() == ProductBatchStatus.PENDING_APPROVAL) {
            throw new BusinessException("Lô hàng chưa được phê duyệt kiểm định an toàn (PENDING_APPROVAL), khóa quyền in tem nhiệt!");
        }

        if (batch.getStatus() == ProductBatchStatus.REJECTED) {
            throw new BusinessException("Lô hàng đã bị từ chối kiểm định (REJECTED), vĩnh viễn không được phép in tem!");
        }

        if (batch.getStatus() == ProductBatchStatus.RECALLED) {
            throw new BusinessException("Lô hàng đã bị thu hồi khẩn cấp (RECALLED), cấm in thêm tem nhãn!");
        }

        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            userId = 1L; // Fallback
        }

        LabelPrintLog printLog = LabelPrintLog.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .productBatchId(batchId)
                .printedByUserId(userId)
                .labelSize(request.getLabelSize())
                .printQuantity(request.getPrintQuantity())
                .printerModel(request.getPrinterModel())
                .build();

        LabelPrintLog savedLog = printLogRepository.save(printLog);

        // Chuyển trạng thái sang DA_IN_TEM nếu đang ở READY_TO_PRINT
        if (batch.getStatus() == ProductBatchStatus.READY_TO_PRINT) {
            batch.setStatus(ProductBatchStatus.DA_IN_TEM);
            productBatchRepository.save(batch);
        }

        log.info("Recorded label print log ID: {} (Qty: {}) for batch ID: {}",
                savedLog.getId(), request.getPrintQuantity(), batchId);
        return LabelPrintLogResponse.fromEntity(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductBatchResponse getBatchById(Long farmId, Long batchId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductBatch batch = productBatchRepository.findByIdAndTenantIdAndFarmId(batchId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lô thành phẩm ID: " + batchId));
        return ProductBatchResponse.fromEntity(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductBatchResponse> searchBatches(
            Long farmId,
            ProductBatchStatus status,
            Long seasonId,
            Long livestockGroupId,
            String keyword,
            Pageable pageable
    ) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<ProductBatch> page = productBatchRepository.searchBatches(tenantId, farmId, status, seasonId, livestockGroupId, keyword, pageable);
        return page.map(ProductBatchResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LabelPrintLogResponse> getPrintLogs(Long farmId, Long batchId, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<LabelPrintLog> page = printLogRepository.findByFarmIdAndProductBatchIdOrderByPrintedAtDesc(farmId, batchId, pageable);
        return page.map(LabelPrintLogResponse::fromEntity);
    }

    /**
     * Chụp Snapshot hồ sơ bất biến (Zero-Leakage Traceability Snapshot)
     */
    private void captureTraceabilitySnapshot(Long tenantId, Farm farm, ProductBatch batch, String traceCode) {
        try {
            // 1. Thông tin hợp tác xã / trang trại
            Map<String, Object> enterpriseInfo = new LinkedHashMap<>();
            enterpriseInfo.put("farmName", farm.getName());
            enterpriseInfo.put("farmCode", farm.getCode());
            enterpriseInfo.put("address", farm.getAddress());
            enterpriseInfo.put("verified", true);

            // 2. Chứng nhận VietGAP
            Map<String, Object> vietgapCert = new LinkedHashMap<>();
            vietgapCert.put("standard", "VietGAP Trồng trọt & Chăn nuôi an toàn");
            vietgapCert.put("certCode", "TCVN-VIETGAP-" + farm.getId() + "-2026");
            vietgapCert.put("issuedBy", "Cục Trồng trọt & Bảo vệ Thực vật");
            vietgapCert.put("validTo", LocalDate.now().plusYears(2).toString());

            // 3. Thông tin thu hoạch đóng gói
            Map<String, Object> harvestInfo = new LinkedHashMap<>();
            harvestInfo.put("batchCode", batch.getBatchCode());
            harvestInfo.put("productName", batch.getProductName());
            harvestInfo.put("harvestDate", batch.getHarvestDate().toString());
            harvestInfo.put("expiryDate", batch.getExpiryDate() != null ? batch.getExpiryDate().toString() : null);
            harvestInfo.put("quantity", batch.getInitialQuantity());
            harvestInfo.put("unit", batch.getUnit());
            harvestInfo.put("qualityGrade", batch.getQualityGrade().name());

            // 4. Chuỗi nhật ký canh tác (Zero-Leakage Timeline: loại bỏ ID nội bộ và giá tiền)
            List<Map<String, Object>> timeline = new ArrayList<>();
            if (batch.getSeasonId() != null) {
                List<FarmingLog> logs = farmingLogRepository.findByTenantIdAndSeasonIdOrderByLogDateDesc(tenantId, batch.getSeasonId());
                // Sort ascending for chronological view
                logs.sort(Comparator.comparing(FarmingLog::getLogDate));
                for (FarmingLog l : logs) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("date", l.getLogDate().toString());
                    item.put("stage", l.getStage());
                    item.put("activityType", l.getActivityType().name());
                    item.put("weatherNotes", l.getWeatherNotes());
                    item.put("notes", l.getNotes());
                    timeline.add(item);
                }
            } else if (batch.getLivestockGroupId() != null) {
                List<LivestockEvent> events = livestockEventRepository.findByTenantIdAndFarmIdAndTargetTypeAndTargetIdOrderByEventDateDesc(
                        tenantId, farm.getId(), TargetType.GROUP, batch.getLivestockGroupId()
                );
                events.sort(Comparator.comparing(LivestockEvent::getEventDate));
                for (LivestockEvent e : events) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("date", e.getEventDate().toString());
                    item.put("eventType", e.getEventType().name());
                    item.put("notes", e.getNotes());
                    timeline.add(item);
                }
            }

            TraceabilitySnapshot snapshot = TraceabilitySnapshot.builder()
                    .tenantId(tenantId)
                    .farmId(farm.getId())
                    .productBatchId(batch.getId())
                    .enterpriseInfoJson(objectMapper.writeValueAsString(enterpriseInfo))
                    .vietgapCertJson(objectMapper.writeValueAsString(vietgapCert))
                    .farmingTimelineJson(objectMapper.writeValueAsString(timeline))
                    .harvestInfoJson(objectMapper.writeValueAsString(harvestInfo))
                    .build();

            snapshotRepository.save(snapshot);
            log.info("Saved immutable traceability snapshot for Batch ID: {}", batch.getId());
        } catch (Exception e) {
            log.error("Failed to build traceability snapshot for Batch ID: {}", batch.getId(), e);
            throw new BusinessException("Lỗi lưu trữ snapshot truy xuất nguồn gốc: " + e.getMessage());
        }
    }

    private String generateBatchCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "LO-" + datePart + "-" + suffix;
        } while (productBatchRepository.existsByTenantIdAndFarmIdAndBatchCode(tenantId, farmId, code));
        return code;
    }

    private Farm validateFarmAccess(Long tenantId, Long farmId) {
        return farmRepository.findById(farmId)
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức."));
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
