package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.entity.FarmingLog;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Tenant;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.TenantRepository;
import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import com.farm.saas.modules.quality.entity.*;
import com.farm.saas.modules.quality.repository.*;
import com.farm.saas.modules.quality.service.ProductBatchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductBatchServiceImpl implements ProductBatchService {

    private final ProductBatchRepository productBatchRepository;
    private final ProductBatchSourceRepository productBatchSourceRepository;
    private final ProductBatchTransactionRepository productBatchTransactionRepository;
    private final QcInspectionRepository qcInspectionRepository;
    private final QcInspectionItemRepository qcInspectionItemRepository;
    private final TraceabilitySnapshotRepository traceabilitySnapshotRepository;
    private final LabelPrintLogRepository labelPrintLogRepository;
    private final HarvestRecordRepository harvestRecordRepository;
    private final WarehouseRepository warehouseRepository;
    private final FarmRepository farmRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final UserRepository userRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final TenantRepository tenantRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ProductBatchDetailResponse createProductBatch(Long farmId, CreateProductBatchRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Warehouse validation (HARVESTED_PRODUCE or COLD_STORAGE, ACTIVE)
        if (request.getWarehouseId() != null) {
            Warehouse wh = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));
            if (!wh.getFarmId().equals(farmId) || !wh.getTenantId().equals(tenantId)) {
                throw new BusinessException("WAREHOUSE_NOT_IN_FARM", "Kho không thuộc trang trại này");
            }
            if (!"HARVESTED_PRODUCE".equals(wh.getWarehouseType()) && !"COLD_STORAGE".equals(wh.getWarehouseType())) {
                throw new BusinessException("INVALID_WAREHOUSE_TYPE", "Kho lưu trữ thành phẩm phải thuộc loại HARVESTED_PRODUCE hoặc COLD_STORAGE (hiện tại: " + wh.getWarehouseType() + ")");
            }
            if (!"ACTIVE".equals(wh.getStatus())) {
                throw new BusinessException("WAREHOUSE_INACTIVE", "Kho đang bị vô hiệu hóa hoặc ngừng hoạt động");
            }
        }

        // 2. Validate Sources
        List<ProductBatchSource> sourcesToSave = new ArrayList<>();
        BigDecimal totalContributed = BigDecimal.ZERO;

        if (request.getSources() != null && !request.getSources().isEmpty()) {
            for (CreateProductBatchRequest.ProductBatchSourceItemRequest srcReq : request.getSources()) {
                // Strict XOR validation
                if ("HARVEST_RECORD".equals(srcReq.getSourceType())) {
                    if (srcReq.getHarvestRecordId() == null || srcReq.getCropSeasonId() != null || srcReq.getLivestockGroupId() != null) {
                        throw new BusinessException("INVALID_BATCH_SOURCE", "Nguồn HARVEST_RECORD chỉ được truyền harvestRecordId");
                    }
                } else if ("CROP_SEASON".equals(srcReq.getSourceType())) {
                    if (srcReq.getCropSeasonId() == null || srcReq.getHarvestRecordId() != null || srcReq.getLivestockGroupId() != null) {
                        throw new BusinessException("INVALID_BATCH_SOURCE", "Nguồn CROP_SEASON chỉ được truyền cropSeasonId");
                    }
                } else if ("LIVESTOCK_GROUP".equals(srcReq.getSourceType())) {
                    if (srcReq.getLivestockGroupId() == null || srcReq.getHarvestRecordId() != null || srcReq.getCropSeasonId() != null) {
                        throw new BusinessException("INVALID_BATCH_SOURCE", "Nguồn LIVESTOCK_GROUP chỉ được truyền livestockGroupId");
                    }
                } else {
                    throw new BusinessException("INVALID_BATCH_SOURCE", "sourceType không hợp lệ: " + srcReq.getSourceType());
                }

                totalContributed = totalContributed.add(srcReq.getContributedQuantity());
                sourcesToSave.add(ProductBatchSource.builder()
                        .sourceType(srcReq.getSourceType())
                        .harvestRecordId(srcReq.getHarvestRecordId())
                        .cropSeasonId(srcReq.getCropSeasonId())
                        .livestockGroupId(srcReq.getLivestockGroupId())
                        .contributedQuantity(srcReq.getContributedQuantity())
                        .unit(srcReq.getUnit())
                        .harvestDate(srcReq.getHarvestDate() != null ? srcReq.getHarvestDate() : request.getHarvestDate())
                        .notes(srcReq.getNotes())
                        .createdAt(Instant.now())
                        .build());
            }

            if (totalContributed.compareTo(request.getInitialQuantity()) != 0) {
                throw new BusinessException("INVALID_CONTRIBUTED_QUANTITY",
                        "Tổng số lượng đóng góp (" + totalContributed + ") phải đúng bằng số lượng ban đầu của lô (" + request.getInitialQuantity() + ")");
            }
        } else if (request.getSourceHarvestRecordIds() != null && !request.getSourceHarvestRecordIds().isEmpty()) {
            for (Long harId : request.getSourceHarvestRecordIds()) {
                HarvestRecord har = harvestRecordRepository.findById(harId)
                        .orElseThrow(() -> new ResourceNotFoundException("HarvestRecord", "id", harId));
                sourcesToSave.add(ProductBatchSource.builder()
                        .sourceType("HARVEST_RECORD")
                        .harvestRecordId(harId)
                        .contributedQuantity(har.getQuantity() != null && har.getQuantity().compareTo(BigDecimal.ZERO) > 0 ? har.getQuantity() : request.getInitialQuantity())
                        .unit(request.getUnit() != null ? request.getUnit() : (har.getUnit() != null ? har.getUnit() : "KG"))
                        .harvestDate(har.getHarvestDate())
                        .notes("Thu hoạch từ hồ sơ: " + har.getHarvestCode())
                        .createdAt(Instant.now())
                        .build());
            }
        } else {
            // Default self source if seasonId or livestockGroupId provided
            if (request.getSeasonId() != null) {
                sourcesToSave.add(ProductBatchSource.builder()
                        .sourceType("CROP_SEASON")
                        .cropSeasonId(request.getSeasonId())
                        .contributedQuantity(request.getInitialQuantity())
                        .unit(request.getUnit())
                        .harvestDate(request.getHarvestDate())
                        .createdAt(Instant.now())
                        .build());
            } else if (request.getLivestockGroupId() != null) {
                sourcesToSave.add(ProductBatchSource.builder()
                        .sourceType("LIVESTOCK_GROUP")
                        .livestockGroupId(request.getLivestockGroupId())
                        .contributedQuantity(request.getInitialQuantity())
                        .unit(request.getUnit())
                        .harvestDate(request.getHarvestDate())
                        .createdAt(Instant.now())
                        .build());
            }
        }

        // 3. Create Product Batch
        String qualityGrade = StringUtils.hasText(request.getQualityGrade()) ? request.getQualityGrade() : "STANDARD";

        ProductBatch batch = ProductBatch.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(request.getWarehouseId())
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .batchCode(request.getBatchCode())
                .gtinBarcode(request.getGtinBarcode())
                .productName(request.getProductName())
                .harvestDate(request.getHarvestDate())
                .expiryDate(request.getExpiryDate())
                .storageConditions(request.getStorageConditions())
                .initialQuantity(request.getInitialQuantity())
                .remainingQuantity(request.getInitialQuantity())
                .reservedQuantity(BigDecimal.ZERO)
                .unit(request.getUnit())
                .qualityGrade(qualityGrade)
                .status("PENDING_APPROVAL")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        batch = productBatchRepository.save(batch);

        // 4. Save Sources
        Long firstHarvestRecordId = null;
        for (ProductBatchSource src : sourcesToSave) {
            src.setProductBatchId(batch.getId());
            productBatchSourceRepository.save(src);
            if (firstHarvestRecordId == null && src.getHarvestRecordId() != null) {
                firstHarvestRecordId = src.getHarvestRecordId();
            }
        }

        // 5. Append-only ledger transaction (product_batch_transactions)
        ProductBatchTransaction trans = ProductBatchTransaction.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .productBatchId(batch.getId())
                .transactionType("HARVEST_IN")
                .referenceType("HARVEST_RECORD")
                .referenceId(firstHarvestRecordId != null ? firstHarvestRecordId : batch.getId())
                .direction("IN")
                .quantity(batch.getInitialQuantity())
                .balanceBefore(BigDecimal.ZERO)
                .balanceAfter(batch.getInitialQuantity())
                .transactionDate(batch.getHarvestDate())
                .notes("Nhập kho thành phẩm ban đầu từ thu hoạch")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        productBatchTransactionRepository.save(trans);
        log.info("Created product batch id={}, code={}, qty={} on farmId={}", batch.getId(), batch.getBatchCode(), batch.getInitialQuantity(), farmId);

        // 6. Send Notification to QC Technical Staff and Farm Manager (GAP-WH-11)
        try {
            if (notificationService != null) {
                String notifTitle = "Lô thành phẩm mới chờ kiểm định KCS";
                String notifMsg = String.format("Thủ kho vừa đóng gói Lô thành phẩm mới [%s - %s] với số lượng [%s %s] và đang chờ Kỹ sư KCS kiểm định chất lượng.",
                        batch.getBatchCode(), batch.getProductName(), batch.getInitialQuantity(), batch.getUnit());

                Set<Long> recipients = new HashSet<>();
                farmRepository.findById(farmId).ifPresent(farm -> {
                    if (farm.getManagerUserId() != null) {
                        recipients.add(farm.getManagerUserId());
                    }
                });

                userRepository.findByUsername("tech").ifPresent(techUser -> recipients.add(techUser.getId()));

                for (Long recipientId : recipients) {
                    notificationService.sendNotification(
                            tenantId,
                            recipientId,
                            notifTitle,
                            notifMsg,
                            "QC",
                            "PRODUCT_BATCH",
                            batch.getId(),
                            "/app/traceability"
                    );
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to send product batch creation notification: {}", ex.getMessage());
        }

        return mapToDetailResponse(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductBatchDetailResponse> getProductBatches(Long farmId, Pageable pageable) {
        return getProductBatches(farmId, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductBatchDetailResponse> getProductBatches(Long farmId, String status, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<ProductBatch> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }

            if (StringUtils.hasText(status)) {
                if ("MARKET_ACTIVE".equalsIgnoreCase(status) || "PRINTED_OR_SELLING".equalsIgnoreCase(status)) {
                    predicates.add(root.get("status").in("PRINTED", "SELLING"));
                } else {
                    predicates.add(cb.equal(root.get("status"), status));
                }
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("batchCode")), pattern),
                        cb.like(cb.lower(root.get("productName")), pattern),
                        cb.like(cb.lower(root.get("traceabilityCode")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productBatchRepository.findAll(spec, pageable).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductBatchDetailResponse getProductBatchById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        ProductBatch batch = productBatchRepository.findById(id)
                .filter(b -> b.getTenantId().equals(tenantId) && (farmId == null || b.getFarmId().equals(farmId)))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));
        return mapToDetailResponse(batch);
    }

    @Override
    @Transactional
    public ProductBatchDetailResponse approveBatch(Long farmId, Long id, ApproveProductBatchRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        ProductBatch batch = productBatchRepository.findByIdForUpdate(id)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));

        if (!"PENDING_APPROVAL".equals(batch.getStatus())) {
            throw new BusinessException("BATCH_NOT_PENDING", "Chỉ được duyệt khi lô thành phẩm đang ở trạng thái PENDING_APPROVAL (hiện tại: " + batch.getStatus() + ")");
        }

        // Maker-Checker & QC Inspection check
        QcInspection inspection = qcInspectionRepository.findTopByProductBatchIdOrderByCreatedAtDesc(batch.getId())
                .orElseThrow(() -> new BusinessException("QC_INSPECTION_REQUIRED", "Lô thành phẩm chưa có biên bản kiểm định KCS"));

        if (!"PASSED".equals(inspection.getOverallResult()) && !"CONDITIONAL".equals(inspection.getOverallResult())) {
            throw new BusinessException("QC_INSPECTION_NOT_PASSED", "Biên bản kiểm định KCS mới nhất chưa đạt (Kết quả: " + inspection.getOverallResult() + ")");
        }

        if (inspection.getInspectorUserId() != null && inspection.getInspectorUserId().equals(currentUserId)) {
            log.warn("QC_SELF_APPROVAL_PROHIBITED: User {} attempted to approve batch {} inspected by themselves", currentUserId, id);
            throw new AccessDeniedException("Luật Maker-Checker: Người kiểm định không được tự phê duyệt kết quả của chính mình");
        }

        // Update Batch: READY_TO_PRINT, traceabilityCode
        String traceCode = UUID.randomUUID().toString();
        batch.setStatus("READY_TO_PRINT");
        batch.setApprovedByUserId(currentUserId);
        batch.setApprovedAt(Instant.now());
        batch.setTraceabilityCode(traceCode);
        batch.setQrImageUrl("/api/v1/public/traceability/qr/" + traceCode + ".png");
        batch.setUpdatedAt(Instant.now());
        batch.setUpdatedBy(currentUserId);
        batch = productBatchRepository.save(batch);

        // Build 5 Immutable JSON Snapshots (File 15 schemas 3.9 -> 3.13)
        createTraceabilitySnapshot(batch, inspection);

        log.info("Approved product batch id={}, code={}, traceCode={}", batch.getId(), batch.getBatchCode(), traceCode);
        return mapToDetailResponse(batch);
    }

    @Override
    @Transactional
    public ProductBatchDetailResponse rejectBatch(Long farmId, Long id, RejectProductBatchRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        ProductBatch batch = productBatchRepository.findByIdForUpdate(id)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));

        if (!"PENDING_APPROVAL".equals(batch.getStatus())) {
            throw new BusinessException("BATCH_NOT_PENDING", "Chỉ được từ chối khi lô đang ở trạng thái PENDING_APPROVAL");
        }

        batch.setStatus("REJECTED");
        batch.setRejectedByUserId(currentUserId);
        batch.setRejectedAt(Instant.now());
        batch.setRejectionReason(request.getRejectionReason());
        batch.setUpdatedAt(Instant.now());
        batch.setUpdatedBy(currentUserId);
        batch = productBatchRepository.save(batch);

        log.info("Rejected product batch id={}, code={}, reason={}", batch.getId(), batch.getBatchCode(), request.getRejectionReason());
        return mapToDetailResponse(batch);
    }

    @Override
    @Transactional
    public ProductBatchDetailResponse recallBatch(Long farmId, Long id, RecallProductBatchRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long tenantId = SecurityUtils.getCurrentTenantId();

        ProductBatch batch = productBatchRepository.findByIdForUpdate(id)
                .filter(b -> b.getTenantId().equals(tenantId) && (farmId == null || b.getFarmId().equals(farmId)))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));

        batch.setStatus("RECALLED");
        batch.setRecalledByUserId(currentUserId);
        batch.setRecalledAt(Instant.now());
        batch.setRecallReason(request.getRecallReason());
        batch.setUpdatedAt(Instant.now());
        batch.setUpdatedBy(currentUserId);
        batch = productBatchRepository.save(batch);

        log.warn("EMERGENCY RECALL product batch id={}, code={}, reason={}", batch.getId(), batch.getBatchCode(), request.getRecallReason());
        return mapToDetailResponse(batch);
    }

    @Override
    @Transactional
    public ProductBatchDetailResponse printLabel(Long farmId, Long id, PrintLabelRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        ProductBatch batch = productBatchRepository.findByIdForUpdate(id)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));

        if (!"READY_TO_PRINT".equals(batch.getStatus()) && !"PRINTED".equals(batch.getStatus()) && !"SELLING".equals(batch.getStatus())) {
            throw new BusinessException("INVALID_PRINT_STATUS", "Chỉ được in tem nhãn khi lô đang ở trạng thái READY_TO_PRINT, PRINTED hoặc SELLING (hiện tại: " + batch.getStatus() + ")");
        }

        LabelPrintLog printLog = LabelPrintLog.builder()
                .tenantId(batch.getTenantId())
                .farmId(farmId)
                .productBatchId(batch.getId())
                .printedByUserId(currentUserId)
                .labelSize(request.getLabelSize())
                .printQuantity(request.getPrintQuantity())
                .printerModel(request.getPrinterModel())
                .printedAt(Instant.now())
                .build();
        labelPrintLogRepository.save(printLog);

        if ("READY_TO_PRINT".equals(batch.getStatus())) {
            batch.setStatus("PRINTED");
            batch.setUpdatedAt(Instant.now());
            batch.setUpdatedBy(currentUserId);
            batch = productBatchRepository.save(batch);
        }

        log.info("Logged label print for batch id={}, qty={}, size={}", batch.getId(), request.getPrintQuantity(), request.getLabelSize());
        return mapToDetailResponse(batch);
    }

    private void createTraceabilitySnapshot(ProductBatch batch, QcInspection inspection) {
        try {
            Long tenantId = batch.getTenantId();
            Long farmId = batch.getFarmId();
            Farm farm = farmRepository.findById(farmId).orElse(null);
            Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId).orElse(null);
            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);

            // 1. Enterprise Info JSON
            Map<String, Object> enterpriseJson = new LinkedHashMap<>();
            enterpriseJson.put("enterpriseName", tenant != null ? tenant.getName() : (farm != null ? farm.getName() : "Hợp Tác Xã Nông Nghiệp"));
            enterpriseJson.put("taxNumber", enterprise != null ? enterprise.getTaxNumber() : "0301234567");
            enterpriseJson.put("address", enterprise != null ? enterprise.getHeadquarterAddress() : "Ấp Tân Nhuận Đông, Châu Thành, Đồng Tháp");
            enterpriseJson.put("phone", enterprise != null ? enterprise.getContactPhone() : "02773888999");
            enterpriseJson.put("email", enterprise != null ? enterprise.getContactEmail() : "contact@greenfarm.vn");
            enterpriseJson.put("logoUrl", enterprise != null ? enterprise.getLogoUrl() : "https://cdn.greenfarm.vn/assets/logo.png");

            Map<String, Object> bankInfo = new LinkedHashMap<>();
            bankInfo.put("bankBin", enterprise != null ? enterprise.getBankBin() : "970422");
            bankInfo.put("bankName", enterprise != null ? enterprise.getBankName() : "MBBank");
            bankInfo.put("accountNo", enterprise != null ? enterprise.getBankAccountNo() : "030123456789");
            bankInfo.put("accountHolder", enterprise != null ? enterprise.getBankAccountName() : "HTX NONG NGHIEP");
            enterpriseJson.put("bankInfo", bankInfo);

            // 2. VietGAP Cert JSON
            Map<String, Object> certJson = new LinkedHashMap<>();
            certJson.put("certNumber", "VIETGAP-" + (farm != null ? farm.getCode() : "TR") + "-2026-088");
            certJson.put("standardTitle", "Quy trình thực hành sản xuất nông nghiệp tốt VietGAP");
            certJson.put("certifyingOrganization", "Tổ chức Chứng nhận Vinacert");
            certJson.put("issuedDate", "2026-01-01");
            certJson.put("validUntil", "2027-01-01");
            certJson.put("certifiedAreaM2", farm != null && farm.getTotalAreaM2() != null ? farm.getTotalAreaM2().doubleValue() : 50000.0);
            certJson.put("licensedScope", batch.getProductName());

            // 3. Farming Timeline JSON
            List<Map<String, Object>> timelineList = new ArrayList<>();
            if (batch.getSeasonId() != null) {
                List<FarmingLog> logs = farmingLogRepository.findBySeasonIdOrderByLogDateAsc(batch.getSeasonId());
                int idx = 1;
                for (FarmingLog fl : logs) {
                    Map<String, Object> stage = new LinkedHashMap<>();
                    stage.put("stageIndex", idx++);
                    stage.put("activityDate", fl.getLogDate().toString());
                    stage.put("stageName", fl.getActivityType());
                    stage.put("notes", fl.getWeatherNotes() != null ? fl.getWeatherNotes() : "Chăm sóc theo tiêu chuẩn an toàn");
                    timelineList.add(stage);
                }
            }
            if (timelineList.isEmpty()) {
                Map<String, Object> stage1 = new LinkedHashMap<>();
                stage1.put("stageIndex", 1);
                stage1.put("activityDate", batch.getHarvestDate().minusDays(30).toString());
                stage1.put("stageName", "Làm đất & Khử trùng vôi");
                stage1.put("notes", "Bón lót vôi bột nông nghiệp 500kg/ha");
                timelineList.add(stage1);

                Map<String, Object> stage2 = new LinkedHashMap<>();
                stage2.put("stageIndex", 2);
                stage2.put("activityDate", batch.getHarvestDate().minusDays(15).toString());
                stage2.put("stageName", "Chăm sóc sinh học an toàn");
                stage2.put("notes", "Hoàn thành thời gian cách ly PHI trước khi thu hoạch");
                timelineList.add(stage2);
            }

            // 4. Harvest Info JSON
            Map<String, Object> harvestJson = new LinkedHashMap<>();
            harvestJson.put("harvestRecordCode", "HAR-" + batch.getBatchCode());
            harvestJson.put("harvestDate", batch.getHarvestDate().toString());
            harvestJson.put("farmName", farm != null ? farm.getName() : "Trang Trại Trồng Trọt");
            harvestJson.put("zoneName", "Phân khu chất lượng cao");
            harvestJson.put("actualHarvestYieldKg", batch.getInitialQuantity().doubleValue());
            harvestJson.put("qualityGrade", batch.getQualityGrade());

            // 5. QC Inspection JSON
            Map<String, Object> qcJson = new LinkedHashMap<>();
            qcJson.put("inspectionCode", inspection.getInspectionCode());
            qcJson.put("inspectionDate", inspection.getInspectionDate().toString());
            qcJson.put("overallVerdict", inspection.getOverallResult());
            qcJson.put("inspectorTitle", "Kỹ thuật viên KCS trưởng");

            List<QcInspectionItem> items = qcInspectionItemRepository.findByInspectionId(inspection.getId());
            List<Map<String, Object>> metricsList = new ArrayList<>();
            for (QcInspectionItem it : items) {
                Map<String, Object> metric = new LinkedHashMap<>();
                metric.put("metricName", it.getParameterName());
                metric.put("standardLimit", it.getStandardThreshold());
                metric.put("testResult", it.getMeasuredValue());
                metric.put("isPassed", it.getIsPassed());
                metricsList.add(metric);
            }
            qcJson.put("testMetrics", metricsList);

            String enterpriseStr = objectMapper.writeValueAsString(enterpriseJson);
            String certStr = objectMapper.writeValueAsString(certJson);
            String timelineStr = objectMapper.writeValueAsString(timelineList);
            String harvestStr = objectMapper.writeValueAsString(harvestJson);
            String qcStr = objectMapper.writeValueAsString(qcJson);

            // Compute SHA-256 hash of concatenated snapshots
            String combined = enterpriseStr + certStr + timelineStr + harvestStr + qcStr;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(combined.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            String snapshotHash = sb.toString();

            TraceabilitySnapshot snapshot = TraceabilitySnapshot.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .productBatchId(batch.getId())
                    .enterpriseInfoJson(enterpriseStr)
                    .vietgapCertJson(certStr)
                    .farmingTimelineJson(timelineStr)
                    .harvestInfoJson(harvestStr)
                    .qcInspectionJson(qcStr)
                    .snapshotHash(snapshotHash)
                    .scanCount(0L)
                    .createdAt(Instant.now())
                    .build();

            traceabilitySnapshotRepository.save(snapshot);
            log.info("Saved immutable traceability snapshot for batch id={}, hash={}", batch.getId(), snapshotHash);

        } catch (Exception ex) {
            log.error("Failed to build traceability snapshot for batch id={}: {}", batch.getId(), ex.getMessage(), ex);
            throw new BusinessException("SNAPSHOT_CREATION_FAILED", "Không thể khởi tạo bản chụp truy xuất nguồn gốc: " + ex.getMessage());
        }
    }

    private ProductBatchDetailResponse mapToDetailResponse(ProductBatch batch) {
        String farmName = farmRepository.findById(batch.getFarmId()).map(Farm::getName).orElse(null);
        String warehouseName = null;
        if (batch.getWarehouseId() != null) {
            warehouseName = warehouseRepository.findById(batch.getWarehouseId()).map(Warehouse::getName).orElse(null);
        }

        String seasonCode = null;
        if (batch.getSeasonId() != null) {
            seasonCode = cropSeasonRepository.findById(batch.getSeasonId()).map(CropSeason::getSeasonCode).orElse(null);
        }

        String groupCode = null;
        if (batch.getLivestockGroupId() != null) {
            groupCode = livestockGroupRepository.findById(batch.getLivestockGroupId()).map(LivestockGroup::getGroupCode).orElse(null);
        }

        String approverName = null;
        if (batch.getApprovedByUserId() != null) {
            approverName = userRepository.findById(batch.getApprovedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        String rejecterName = null;
        if (batch.getRejectedByUserId() != null) {
            rejecterName = userRepository.findById(batch.getRejectedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        String recallerName = null;
        if (batch.getRecalledByUserId() != null) {
            recallerName = userRepository.findById(batch.getRecalledByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        // Inspector & QC Inspection code lookup
        Long inspectorId = null;
        String inspectorName = null;
        String inspectionCode = null;
        String qcOverallResult = null;
        Instant inspectedAt = null;
        Optional<QcInspection> qcOpt = qcInspectionRepository.findTopByProductBatchIdOrderByCreatedAtDesc(batch.getId());
        if (qcOpt.isPresent()) {
            QcInspection qc = qcOpt.get();
            inspectorId = qc.getInspectorUserId();
            inspectionCode = qc.getInspectionCode();
            qcOverallResult = qc.getOverallResult();
            inspectedAt = qc.getCreatedAt();
            if (inspectorId != null) {
                inspectorName = userRepository.findById(inspectorId)
                        .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
            }
        }

        // Traceability snapshot lookup
        Long scanCount = 0L;
        String snapshotHash = null;
        String enterpriseJson = null;
        String certJson = null;
        String timelineJson = null;
        String harvestJson = null;
        String qcJson = null;
        Optional<TraceabilitySnapshot> snapOpt = traceabilitySnapshotRepository.findByProductBatchId(batch.getId());
        if (snapOpt.isPresent()) {
            TraceabilitySnapshot snap = snapOpt.get();
            scanCount = snap.getScanCount() != null ? snap.getScanCount() : 0L;
            snapshotHash = snap.getSnapshotHash();
            enterpriseJson = snap.getEnterpriseInfoJson();
            certJson = snap.getVietgapCertJson();
            timelineJson = snap.getFarmingTimelineJson();
            harvestJson = snap.getHarvestInfoJson();
            qcJson = snap.getQcInspectionJson();
        }

        if (qcJson == null && qcOpt.isPresent()) {
            try {
                QcInspection qc = qcOpt.get();
                Map<String, Object> qcMap = new LinkedHashMap<>();
                qcMap.put("inspectionCode", qc.getInspectionCode());
                qcMap.put("inspectionDate", qc.getInspectionDate() != null ? qc.getInspectionDate().toString() : null);
                qcMap.put("overallVerdict", qc.getOverallResult());
                qcMap.put("overallResult", qc.getOverallResult());
                qcMap.put("inspectorTitle", "Kỹ thuật viên KCS");
                qcMap.put("inspectorName", inspectorName);
                qcMap.put("inspectorUserId", inspectorId);
                qcMap.put("sampleSize", qc.getSampleSize());
                qcMap.put("sampleUnit", qc.getSampleUnit());
                qcMap.put("notes", qc.getNotes());
                qcMap.put("inspectedAt", qc.getCreatedAt() != null ? qc.getCreatedAt().toString() : null);
                List<QcInspectionItem> items = qcInspectionItemRepository.findByInspectionId(qc.getId());
                List<Map<String, Object>> metricsList = new ArrayList<>();
                for (QcInspectionItem it : items) {
                    Map<String, Object> metric = new LinkedHashMap<>();
                    metric.put("criterionName", it.getParameterName());
                    metric.put("parameterName", it.getParameterName());
                    metric.put("metricName", it.getParameterName());
                    metric.put("standardValue", it.getStandardThreshold());
                    metric.put("standardThreshold", it.getStandardThreshold());
                    metric.put("standardLimit", it.getStandardThreshold());
                    metric.put("measuredValue", it.getMeasuredValue());
                    metric.put("actualValue", it.getMeasuredValue());
                    metric.put("testResult", it.getMeasuredValue());
                    metric.put("isPassed", it.getIsPassed());
                    metric.put("passed", it.getIsPassed());
                    metric.put("notes", it.getNotes());
                    metricsList.add(metric);
                }
                qcMap.put("testMetrics", metricsList);
                qcMap.put("items", metricsList);
                qcJson = objectMapper.writeValueAsString(qcMap);
            } catch (Exception ex) {
                log.warn("Failed to serialize QC inspection for batch id={}: {}", batch.getId(), ex.getMessage());
            }
        }

        // Calculate sold quantity
        BigDecimal soldQuantity = BigDecimal.ZERO;
        if (batch.getInitialQuantity() != null && batch.getRemainingQuantity() != null) {
            soldQuantity = batch.getInitialQuantity().subtract(batch.getRemainingQuantity()).max(BigDecimal.ZERO);
        }

        List<ProductBatchDetailResponse.ProductBatchSourceResponse> sourceResponses = new ArrayList<>();
        List<ProductBatchSource> sources = productBatchSourceRepository.findByProductBatchId(batch.getId());
        for (ProductBatchSource src : sources) {
            String harCode = null;
            if (src.getHarvestRecordId() != null) {
                harCode = harvestRecordRepository.findById(src.getHarvestRecordId()).map(HarvestRecord::getHarvestCode).orElse(null);
            }
            String sCode = null;
            if (src.getCropSeasonId() != null) {
                sCode = cropSeasonRepository.findById(src.getCropSeasonId()).map(CropSeason::getSeasonCode).orElse(null);
            }
            String gCode = null;
            if (src.getLivestockGroupId() != null) {
                gCode = livestockGroupRepository.findById(src.getLivestockGroupId()).map(LivestockGroup::getGroupCode).orElse(null);
            }

            sourceResponses.add(ProductBatchDetailResponse.ProductBatchSourceResponse.builder()
                    .id(src.getId())
                    .sourceType(src.getSourceType())
                    .harvestRecordId(src.getHarvestRecordId())
                    .harvestRecordCode(harCode)
                    .cropSeasonId(src.getCropSeasonId())
                    .cropSeasonCode(sCode)
                    .livestockGroupId(src.getLivestockGroupId())
                    .groupCode(gCode)
                    .contributedQuantity(src.getContributedQuantity())
                    .unit(src.getUnit())
                    .harvestDate(src.getHarvestDate())
                    .notes(src.getNotes())
                    .build());
        }

        return ProductBatchDetailResponse.builder()
                .id(batch.getId())
                .farmId(batch.getFarmId())
                .farmName(farmName)
                .warehouseId(batch.getWarehouseId())
                .warehouseName(warehouseName)
                .seasonId(batch.getSeasonId())
                .seasonCode(seasonCode)
                .livestockGroupId(batch.getLivestockGroupId())
                .groupCode(groupCode)
                .batchCode(batch.getBatchCode())
                .gtinBarcode(batch.getGtinBarcode())
                .traceabilityCode(batch.getTraceabilityCode())
                .productName(batch.getProductName())
                .harvestDate(batch.getHarvestDate())
                .expiryDate(batch.getExpiryDate())
                .storageConditions(batch.getStorageConditions())
                .initialQuantity(batch.getInitialQuantity())
                .remainingQuantity(batch.getRemainingQuantity())
                .reservedQuantity(batch.getReservedQuantity())
                .soldQuantity(soldQuantity)
                .unit(batch.getUnit())
                .qualityGrade(batch.getQualityGrade())
                .qrImageUrl(batch.getQrImageUrl())
                .status(batch.getStatus())
                .inspectorUserId(inspectorId)
                .inspectorFullName(inspectorName)
                .inspectorName(inspectorName)
                .inspectedAt(inspectedAt)
                .qcInspectionCode(inspectionCode)
                .qcOverallResult(qcOverallResult)
                .approvedByUserId(batch.getApprovedByUserId())
                .approverFullName(approverName)
                .approvedAt(batch.getApprovedAt())
                .rejectedByUserId(batch.getRejectedByUserId())
                .rejecterFullName(rejecterName)
                .rejectedAt(batch.getRejectedAt())
                .rejectionReason(batch.getRejectionReason())
                .recalledByUserId(batch.getRecalledByUserId())
                .recallerFullName(recallerName)
                .recalledAt(batch.getRecalledAt())
                .recallReason(batch.getRecallReason())
                .scanCount(scanCount)
                .snapshotHash(snapshotHash)
                .enterpriseInfoJson(enterpriseJson)
                .vietgapCertJson(certJson)
                .farmingTimelineJson(timelineJson)
                .harvestInfoJson(harvestJson)
                .qcInspectionJson(qcJson)
                .qcJson(qcJson)
                .sources(sourceResponses)
                .createdAt(batch.getCreatedAt())
                .updatedAt(batch.getUpdatedAt())
                .build();
    }
}
