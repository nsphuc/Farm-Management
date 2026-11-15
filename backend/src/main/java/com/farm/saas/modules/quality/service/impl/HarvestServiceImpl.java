package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockEventRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.CropType;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.entity.WarehouseReceipt;
import com.farm.saas.modules.inventory.entity.WarehouseReceiptItem;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.repository.WarehouseReceiptItemRepository;
import com.farm.saas.modules.inventory.repository.WarehouseReceiptRepository;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import com.farm.saas.modules.quality.entity.HarvestRecord;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.ProductBatchSource;
import com.farm.saas.modules.quality.repository.HarvestRecordRepository;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.ProductBatchSourceRepository;
import com.farm.saas.modules.quality.service.HarvestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.farm.saas.common.codegenerator.CodeGenerator;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Triển khai dịch vụ quản lý thu hoạch nông sản và xuất bán vật nuôi.
 * Xử lý kiểm tra thời gian cách ly (PHI/Withdrawal), cập nhật sản lượng mùa vụ/đàn nuôi,
 * và tự động đồng bộ hóa tạo lô thành phẩm KCS cùng phiếu nhập kho tương ứng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HarvestServiceImpl implements HarvestService {

    private final HarvestRecordRepository harvestRecordRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final CropTypeRepository cropTypeRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductBatchSourceRepository productBatchSourceRepository;
    private final ProductBatchRepository productBatchRepository;
    private final NotificationService notificationService;
    private final CodeGenerator codeGenerator;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WarehouseRepository warehouseRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WarehouseInventoryRepository warehouseInventoryRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WarehouseReceiptItemRepository warehouseReceiptItemRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private MaterialRepository materialRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private LivestockBreedRepository breedRepository;

    /**
     * Tạo biên bản thu hoạch mới cho vụ mùa hoặc đàn vật nuôi.
     * Kiểm tra điều kiện cách ly an toàn (PHI/thời gian bài thải thuốc),
     * cập nhật trạng thái mùa vụ từ GROWING sang HARVESTING,
     * tự động đóng lô sản phẩm KCS và tạo phiếu nhập kho nếu áp dụng.
     *
     * @param farmId  ID trang trại thực hiện thu hoạch
     * @param request Dữ liệu yêu cầu thu hoạch
     * @return DTO chi tiết biên bản thu hoạch vừa tạo
     * @throws BusinessException         nếu vi phạm thời gian cách ly PHI hoặc cấu hình nguồn thu hoạch không hợp lệ
     * @throws ResourceNotFoundException nếu không tìm thấy mùa vụ hoặc đàn vật nuôi tương ứng
     */
    @Override
    @Transactional
    public HarvestRecordDetailResponse createHarvestRecord(Long farmId, CreateHarvestRecordRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        String sourceType = request.getSourceType();
        if (!StringUtils.hasText(sourceType)) {
            if (request.getSeasonId() != null) {
                sourceType = "CROP_SEASON";
            } else if (request.getLivestockGroupId() != null) {
                sourceType = "LIVESTOCK_GROUP";
            } else {
                sourceType = "CROP_SEASON";
            }
        }

        // 1. Strict XOR Source Validation (chk_harvest_records_source)
        if ("CROP_SEASON".equals(sourceType)) {
            if (request.getSeasonId() == null || request.getLivestockGroupId() != null) {
                throw new BusinessException("INVALID_HARVEST_SOURCE", "Nguồn CROP_SEASON bắt buộc phải có seasonId và không được truyền livestockGroupId");
            }
        } else if ("LIVESTOCK_GROUP".equals(sourceType)) {
            if (request.getLivestockGroupId() == null || request.getSeasonId() != null) {
                throw new BusinessException("INVALID_HARVEST_SOURCE", "Nguồn LIVESTOCK_GROUP bắt buộc phải có livestockGroupId và không được truyền seasonId");
            }
        } else {
            throw new BusinessException("INVALID_HARVEST_SOURCE", "sourceType phải là CROP_SEASON hoặc LIVESTOCK_GROUP");
        }

        CropSeason season = null;
        LivestockGroup group = null;

        // 2. PHI / Withdrawal Guard
        if ("CROP_SEASON".equals(sourceType)) {
            season = cropSeasonRepository.findById(request.getSeasonId())
                    .orElseThrow(() -> new ResourceNotFoundException("CropSeason", "id", request.getSeasonId()));

            if (!season.getFarmId().equals(farmId) || !season.getTenantId().equals(tenantId)) {
                throw new BusinessException("SEASON_NOT_IN_FARM", "Mùa vụ không thuộc trang trại này");
            }

            if (!"GROWING".equals(season.getStatus()) && !"HARVESTING".equals(season.getStatus())) {
                throw new BusinessException("INVALID_SEASON_STATUS", "Chỉ được thu hoạch khi mùa vụ đang ở trạng thái GROWING hoặc HARVESTING (hiện tại: " + season.getStatus() + ")");
            }

            LocalDate maxPhiEndDate = farmingLogRepository.findMaxPhiEndDateBySeasonId(season.getId());
            if (maxPhiEndDate != null && !request.getHarvestDate().isAfter(maxPhiEndDate)) {
                log.warn("HARVEST_BLOCKED_BY_PHI: Season {} harvestDate {} <= maxPhiEndDate {}", season.getId(), request.getHarvestDate(), maxPhiEndDate);
                throw new BusinessException("HARVEST_BLOCKED_BY_PHI", "Mùa vụ đang trong thời gian cách ly an toàn nông dược (PHI đến ngày " + maxPhiEndDate + ")");
            }

            // Update season actual yield and transition status if GROWING -> HARVESTING
            BigDecimal currentYield = season.getActualYieldKg() != null ? season.getActualYieldKg() : BigDecimal.ZERO;
            season.setActualYieldKg(currentYield.add(request.getQuantity()));
            if ("GROWING".equals(season.getStatus())) {
                season.setStatus("HARVESTING");
            }
            if (season.getActualHarvestDate() == null) {
                season.setActualHarvestDate(request.getHarvestDate());
            }
            season.setUpdatedAt(Instant.now());
            cropSeasonRepository.save(season);

        } else {
            group = livestockGroupRepository.findById(request.getLivestockGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("LivestockGroup", "id", request.getLivestockGroupId()));

            if (!group.getFarmId().equals(farmId) || !group.getTenantId().equals(tenantId)) {
                throw new BusinessException("GROUP_NOT_IN_FARM", "Đàn nuôi không thuộc trang trại này");
            }

            if ("QUARANTINED".equals(group.getStatus()) || "SOLD".equals(group.getStatus()) || "CULLED".equals(group.getStatus())) {
                throw new BusinessException("INVALID_GROUP_STATUS", "Đàn nuôi đang ở trạng thái không cho phép xuất chuồng: " + group.getStatus());
            }

            LocalDate maxWithdrawalEndDate = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
            if (maxWithdrawalEndDate != null && !request.getHarvestDate().isAfter(maxWithdrawalEndDate)) {
                log.warn("HARVEST_BLOCKED_BY_WITHDRAWAL: Group {} harvestDate {} <= maxWithdrawalEndDate {}", group.getId(), request.getHarvestDate(), maxWithdrawalEndDate);
                throw new BusinessException("HARVEST_BLOCKED_BY_WITHDRAWAL", "Đàn nuôi đang trong thời gian cách ly ngưng thuốc thú y đến hết ngày " + maxWithdrawalEndDate);
            }
        }

        // 3. Generate harvest code if omitted
        String harvestCode = request.getHarvestCode();
        if (!StringUtils.hasText(harvestCode)) {
            harvestCode = "HAR-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        String qualityGrade = request.getQualityGrade();

        // 4. Resolve harvester User ID
        Long harvesterUserId = request.getHarvestedByUserId();
        if (harvesterUserId == null && request.getHarvestedByEmployeeId() != null) {
            harvesterUserId = employeeRepository.findById(request.getHarvestedByEmployeeId())
                    .map(e -> e.getUserId())
                    .orElse(null);
        }
        if (harvesterUserId == null) {
            harvesterUserId = currentUserId;
        }

        String combinedNotes = request.getNotes() != null ? request.getNotes().trim() : "";
        if (request.getLossPercentage() != null && request.getLossPercentage().compareTo(BigDecimal.ZERO) > 0) {
            String lossText = "Tỷ lệ hao hụt: " + request.getLossPercentage() + "%";
            if (!combinedNotes.contains(lossText)) {
                combinedNotes = (combinedNotes.isEmpty() ? "" : combinedNotes + " | ") + lossText;
            }
        }

        HarvestRecord record = HarvestRecord.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .harvestCode(harvestCode)
                .harvestDate(request.getHarvestDate())
                .sourceType(sourceType)
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .qualityGrade(qualityGrade)
                .harvestedByUserId(harvesterUserId)
                .notes(combinedNotes)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        final HarvestRecord savedRecord = harvestRecordRepository.save(record);
        log.info("Saved harvest record id={}, code={} on farmId={}", savedRecord.getId(), savedRecord.getHarvestCode(), farmId);

        // Quy trình 2: Tự động tạo Lô thành phẩm KCS (ProductBatch) & Phiếu nhập kho (WarehouseReceipt) 1-click
        if (request.getAutoCreateBatchAndReceipt() == null || Boolean.TRUE.equals(request.getAutoCreateBatchAndReceipt())) {
            try {
                autoCreateProductBatchAndWarehouseReceipt(savedRecord, season, group, currentUserId, request.getWarehouseId());
            } catch (Exception ex) {
                log.error("Lỗi khi tự động tạo lô thành phẩm & phiếu nhập kho cho biên bản thu hoạch id={}: {}",
                        savedRecord.getId(), ex.getMessage(), ex);
            }
        }

        // 5. Send Notification to Warehouse Staff and Farm Manager
        try {
            if (notificationService != null) {
                String sourceInfo = "CROP_SEASON".equals(savedRecord.getSourceType())
                        ? (season != null ? "mùa vụ [" + season.getSeasonCode() + "]" : "vụ mùa")
                        : (group != null ? "đàn nuôi [" + group.getGroupCode() + "]" : "đàn nuôi");

                String notifTitle = "Biên bản thu hoạch mới chờ tiếp nhận đóng gói lô";
                String notifMsg = String.format("Đợt thu hoạch từ %s với sản lượng %s %s đã hoàn tất và đang chờ tiếp nhận đóng gói lô thành phẩm.",
                        sourceInfo, savedRecord.getQuantity(), savedRecord.getUnit());

                farmRepository.findById(farmId).ifPresent(farm -> {
                    if (farm.getManagerUserId() != null) {
                        notificationService.sendNotification(
                                savedRecord.getTenantId(),
                                farm.getManagerUserId(),
                                notifTitle,
                                notifMsg,
                                "QC",
                                "HARVEST_RECORD",
                                savedRecord.getId(),
                                "/app/farming"
                        );
                    }
                });

                userRepository.findByUsername("warehouse").ifPresent(whUser -> {
                    notificationService.sendNotification(
                            savedRecord.getTenantId(),
                            whUser.getId(),
                            notifTitle,
                            notifMsg,
                            "QC",
                            "HARVEST_RECORD",
                            savedRecord.getId(),
                            "/app/farming"
                    );
                });
            }
        } catch (Exception ex) {
            log.warn("Failed to send harvest notification: {}", ex.getMessage());
        }

        return mapToDetailResponse(savedRecord);
    }

    /**
     * Quy trình tự động tạo Lô thành phẩm KCS (ProductBatch) và Phiếu nhập kho (WarehouseReceipt) 1-Click.
     * Xác định kho lưu trữ phù hợp (ưu tiên kho mát hoặc kho thành phẩm), liên kết nguồn gốc thu hoạch,
     * tự động tạo mã định danh và tăng tồn kho khả dụng (ngoại trừ vật nuôi sống giữ tại chuồng).
     *
     * @param harvestRecord        Biên bản thu hoạch vừa lập
     * @param season               Thực thể vụ mùa thu hoạch (nếu có)
     * @param group                Thực thể đàn vật nuôi xuất bán (nếu có)
     * @param currentUserId        ID người dùng thao tác
     * @param preferredWarehouseId ID kho thành phẩm được chỉ định (tùy chọn)
     */
    private void autoCreateProductBatchAndWarehouseReceipt(HarvestRecord harvestRecord, CropSeason season, LivestockGroup group, Long currentUserId, Long preferredWarehouseId) {
        if (productBatchRepository == null || productBatchSourceRepository == null) {
            return;
        }

        Long tenantId = harvestRecord.getTenantId();
        Long farmId = harvestRecord.getFarmId();

        // 1. Tìm kho thành phẩm (ưu tiên preferredWarehouseId do người dùng chọn, hoặc kho COLD_STORAGE, hoặc HARVESTED_PRODUCE)
        Warehouse produceWh = null;
        if (warehouseRepository != null) {
            if (preferredWarehouseId != null) {
                produceWh = warehouseRepository.findById(preferredWarehouseId)
                        .filter(w -> w.getFarmId().equals(farmId) && "ACTIVE".equalsIgnoreCase(w.getStatus()))
                        .orElse(null);
            }
            if (produceWh == null) {
                var whList = warehouseRepository.findByFarmId(farmId);
                produceWh = whList.stream()
                        .filter(w -> "COLD_STORAGE".equalsIgnoreCase(w.getWarehouseType()) && "ACTIVE".equalsIgnoreCase(w.getStatus()))
                        .findFirst()
                        .orElseGet(() -> whList.stream()
                                .filter(w -> "HARVESTED_PRODUCE".equalsIgnoreCase(w.getWarehouseType()) && "ACTIVE".equalsIgnoreCase(w.getStatus()))
                                .findFirst()
                                .orElse(null));
                if (produceWh == null && !whList.isEmpty()) {
                    produceWh = whList.stream().filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus())).findFirst().orElse(null);
                }
            }
        }

        // 2. Xác định tên sản phẩm thành phẩm
        String productName = "Nông sản thu hoạch";
        boolean isLiveAnimal = false;
        if ("CROP_SEASON".equals(harvestRecord.getSourceType())) {
            if (season != null && season.getCropTypeId() != null && cropTypeRepository != null) {
                productName = cropTypeRepository.findById(season.getCropTypeId())
                        .map(c -> c.getName() + " (Vụ " + season.getSeasonCode() + ")")
                        .orElse("Nông sản vụ " + season.getSeasonCode());
            } else if (season != null) {
                productName = "Nông sản vụ " + season.getSeasonCode();
            }
        } else {
            isLiveAnimal = "CON".equalsIgnoreCase(harvestRecord.getUnit());
            if (isLiveAnimal) {
                if (group != null && group.getBreedId() != null && breedRepository != null) {
                    productName = breedRepository.findById(group.getBreedId())
                            .map(b -> b.getBreedName() + " thương phẩm xuất chuồng (Đàn " + group.getGroupCode() + ")")
                            .orElse("Đàn vật nuôi xuất chuồng (" + group.getGroupCode() + ")");
                } else if (group != null) {
                    productName = "Đàn vật nuôi xuất chuồng (" + group.getGroupCode() + ")";
                }
            } else {
                String unitStr = harvestRecord.getUnit() != null ? harvestRecord.getUnit().toUpperCase() : "KG";
                String typeName = "LIT".equals(unitStr) ? "Sữa tươi nguyên liệu" : ("QUA".equals(unitStr) || "VI".equals(unitStr) ? "Trứng gia cầm" : "Sản phẩm chăn nuôi");
                productName = typeName + " (Đàn " + (group != null ? group.getGroupCode() : "") + ")";
            }
        }

        // 3. Khởi tạo Lô thành phẩm KCS (ProductBatch)
        String batchCode = isLiveAnimal
                ? ("BATCH-LIVE-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now()) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
                : ("BATCH-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now()) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());

        String initialImageUrl = null;
        if (season != null && season.getCropTypeId() != null && cropTypeRepository != null) {
            initialImageUrl = cropTypeRepository.findById(season.getCropTypeId())
                    .map(CropType::getImageUrl)
                    .orElse(null);
        } else if (group != null && group.getBreedId() != null && breedRepository != null) {
            initialImageUrl = breedRepository.findById(group.getBreedId())
                    .map(LivestockBreed::getImageUrl)
                    .orElse(null);
        }

        ProductBatch batch = ProductBatch.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(!isLiveAnimal && produceWh != null ? produceWh.getId() : null)
                .seasonId(season != null ? season.getId() : null)
                .livestockGroupId(group != null ? group.getId() : null)
                .batchCode(batchCode)
                .productName(productName)
                .initialQuantity(harvestRecord.getQuantity())
                .remainingQuantity(harvestRecord.getQuantity())
                .reservedQuantity(BigDecimal.ZERO)
                .unit(harvestRecord.getUnit() != null ? harvestRecord.getUnit() : "KG")
                .qualityGrade(harvestRecord.getQualityGrade() != null ? harvestRecord.getQualityGrade() : "GRADE_A")
                .harvestDate(harvestRecord.getHarvestDate())
                .expiryDate(harvestRecord.getHarvestDate().plusDays(isLiveAnimal ? 90 : 30))
                .status("PENDING_APPROVAL")
                .qrImageUrl(initialImageUrl)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        batch = productBatchRepository.save(batch);

        ProductBatchSource source = ProductBatchSource.builder()
                .productBatchId(batch.getId())
                .sourceType("HARVEST_RECORD")
                .harvestRecordId(harvestRecord.getId())
                .contributedQuantity(harvestRecord.getQuantity())
                .unit(harvestRecord.getUnit() != null ? harvestRecord.getUnit() : "KG")
                .harvestDate(harvestRecord.getHarvestDate())
                .build();
        productBatchSourceRepository.save(source);

        // 4. Khởi tạo Phiếu nhập kho (WarehouseReceipt) & Tăng tồn kho thực tế
        // Lưu ý nghiệp vụ: VẬT NUÔI SỐNG (isLiveAnimal = true) ở nguyên tại chuồng trại, KHÔNG tạo phiếu nhập kho vật lý!
        // Chỉ Nông sản thu hoạch, Trứng, Sữa hoặc thịt sơ chế mới nhập kho bảo quản.
        if (!isLiveAnimal && produceWh != null && warehouseReceiptRepository != null && warehouseReceiptItemRepository != null && warehouseInventoryRepository != null) {
            String receiptCode = "RCP-HAR-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            WarehouseReceipt receipt = WarehouseReceipt.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(produceWh.getId())
                    .receiptCode(receiptCode)
                    .receiptType("HARVEST_RETURN")
                    .receiptDate(harvestRecord.getHarvestDate())
                    .totalAmount(BigDecimal.ZERO)
                    .status("COMPLETED")
                    .notes("Tự động nhập kho thành phẩm từ biên bản thu hoạch " + harvestRecord.getHarvestCode() + " (Lô KCS: " + batch.getBatchCode() + ")")
                    .approvedBy(currentUserId)
                    .approvedAt(Instant.now())
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            receipt = warehouseReceiptRepository.save(receipt);

            // Tìm hoặc tự động tạo danh mục nông sản thành phẩm tương ứng trong kho
            Material produceMat = null;
            if (materialRepository != null) {
                var materials = materialRepository.findByTenantId(tenantId);
                final String finalProdName = productName.toLowerCase();
                produceMat = materials.stream()
                        .filter(m -> m.getName().equalsIgnoreCase(finalProdName) || (season != null && season.getCropTypeId() != null && season.getCropTypeId().equals(m.getCropTypeId()) && m.getName().toLowerCase().contains("thành phẩm")))
                        .findFirst()
                        .orElse(null);

                if (produceMat == null) {
                    String skuCode = "PROD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    produceMat = Material.builder()
                            .tenantId(tenantId)
                            .categoryId(5L)
                            .skuCode(skuCode)
                            .name(productName)
                            .cropTypeId(season != null ? season.getCropTypeId() : null)
                            .standardUnit(harvestRecord.getUnit() != null ? harvestRecord.getUnit() : "KG")
                            .dispatchStrategy("FEFO")
                            .expiryAlertDays(15)
                            .minStockLevel(BigDecimal.ZERO)
                            .unitPriceStandard(BigDecimal.ZERO)
                            .defaultPhiDays(0)
                            .status("ACTIVE")
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();
                    produceMat = materialRepository.save(produceMat);
                    log.info("Auto-created produce material id={}, sku={}, name={} for warehouse storage",
                            produceMat.getId(), produceMat.getSkuCode(), produceMat.getName());
                }
            }

            if (produceMat != null) {
                BigDecimal unitPrice = produceMat.getUnitPriceStandard() != null ? produceMat.getUnitPriceStandard() : BigDecimal.ZERO;
                BigDecimal lineTotal = harvestRecord.getQuantity().multiply(unitPrice);

                WarehouseReceiptItem item = WarehouseReceiptItem.builder()
                        .receiptId(receipt.getId())
                        .tenantId(tenantId)
                        .materialId(produceMat.getId())
                        .batchNumber(batch.getBatchCode())
                        .expiryDate(harvestRecord.getHarvestDate().plusDays(30))
                        .enteredUnit(harvestRecord.getUnit() != null ? harvestRecord.getUnit() : "KG")
                        .enteredQuantity(harvestRecord.getQuantity())
                        .conversionFactor(BigDecimal.ONE)
                        .quantity(harvestRecord.getQuantity())
                        .unitPrice(unitPrice)
                        .totalPrice(lineTotal)
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();
                warehouseReceiptItemRepository.save(item);

                // Cập nhật tồn kho dương (WarehouseInventory)
                var existingInvOpt = warehouseInventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                        produceWh.getId(), produceMat.getId(), batch.getBatchCode());
                WarehouseInventory inv;
                if (existingInvOpt.isPresent()) {
                    inv = existingInvOpt.get();
                    inv.setQuantityOnHand(inv.getQuantityOnHand().add(harvestRecord.getQuantity()));
                    inv.setUpdatedAt(Instant.now());
                } else {
                    inv = WarehouseInventory.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .warehouseId(produceWh.getId())
                            .materialId(produceMat.getId())
                            .batchNumber(batch.getBatchCode())
                            .quantityOnHand(harvestRecord.getQuantity())
                            .reservedQuantity(BigDecimal.ZERO)
                            .unitCost(unitPrice)
                            .inwardDate(harvestRecord.getHarvestDate())
                            .expiryDate(harvestRecord.getHarvestDate().plusDays(30))
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();
                }
                warehouseInventoryRepository.save(inv);

                // Ghi nhận transaction
                if (warehouseInventoryTransactionRepository != null) {
                    WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .warehouseId(produceWh.getId())
                            .materialId(produceMat.getId())
                            .batchNumber(batch.getBatchCode())
                            .transactionType("RECEIPT")
                            .referenceDocType("WAREHOUSE_RECEIPT")
                            .referenceDocId(receipt.getId())
                            .referenceItemId(item.getId())
                            .direction("IN")
                            .quantity(harvestRecord.getQuantity())
                            .unitPrice(unitPrice)
                            .totalAmount(lineTotal)
                            .balanceBefore(inv.getQuantityOnHand().subtract(harvestRecord.getQuantity()))
                            .balanceAfter(inv.getQuantityOnHand())
                            .transactionDate(harvestRecord.getHarvestDate())
                            .notes("Tự động nhập kho thành phẩm theo phiếu " + receiptCode + " từ biên bản thu hoạch " + harvestRecord.getHarvestCode())
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();
                    warehouseInventoryTransactionRepository.save(trans);
                }
            }

            log.info("Auto-created ProductBatch id={}, code={} and WarehouseReceipt id={}, code={} for harvest record id={}",
                    batch.getId(), batch.getBatchCode(), receipt.getId(), receipt.getReceiptCode(), harvestRecord.getId());
        }
    }

    /**
     * Lấy danh sách phân trang các biên bản thu hoạch của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang và sắp xếp dữ liệu
     * @return Trang danh sách biên bản thu hoạch chi tiết
     */
    @Override
    @Transactional(readOnly = true)
    public Page<HarvestRecordDetailResponse> getHarvestRecords(Long farmId, Pageable pageable) {
        return harvestRecordRepository.findByFarmId(farmId, pageable).map(this::mapToDetailResponse);
    }

    /**
     * Lấy chi tiết thông tin biên bản thu hoạch theo ID.
     *
     * @param farmId ID trang trại
     * @param id     ID biên bản thu hoạch
     * @return Chi tiết biên bản thu hoạch
     * @throws ResourceNotFoundException nếu không tìm thấy biên bản trong trang trại
     */
    @Override
    @Transactional(readOnly = true)
    public HarvestRecordDetailResponse getHarvestRecordById(Long farmId, Long id) {
        HarvestRecord record = harvestRecordRepository.findById(id)
                .filter(r -> r.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("HarvestRecord", "id", id));
        return mapToDetailResponse(record);
    }

    /**
     * Chuyển đổi thực thể HarvestRecord thành DTO chi tiết HarvestRecordDetailResponse,
     * bao gồm tra cứu tên trang trại, mã mùa vụ, giống cây trồng/vật nuôi và tên người thu hoạch.
     *
     * @param record Thực thể biên bản thu hoạch
     * @return DTO chi tiết biên bản thu hoạch
     */
    private HarvestRecordDetailResponse mapToDetailResponse(HarvestRecord record) {
        String farmName = farmRepository.findById(record.getFarmId()).map(f -> f.getName()).orElse(null);
        String seasonCode = null;
        String cropTypeName = null;
        if (record.getSeasonId() != null) {
            CropSeason season = cropSeasonRepository.findById(record.getSeasonId()).orElse(null);
            if (season != null) {
                seasonCode = season.getSeasonCode();
                if (season.getCropTypeId() != null) {
                    cropTypeName = cropTypeRepository.findById(season.getCropTypeId()).map(c -> c.getName()).orElse(null);
                }
            }
        }

        String groupCode = null;
        if (record.getLivestockGroupId() != null) {
            groupCode = livestockGroupRepository.findById(record.getLivestockGroupId()).map(g -> g.getGroupCode()).orElse(null);
        }

        String harvesterName = null;
        if (record.getHarvestedByUserId() != null) {
            harvesterName = userRepository.findById(record.getHarvestedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        Long productBatchId = null;
        String productBatchCode = null;
        if (productBatchSourceRepository != null) {
            List<ProductBatchSource> sources = productBatchSourceRepository.findByHarvestRecordId(record.getId());
            if (sources != null && !sources.isEmpty()) {
                ProductBatchSource src = sources.get(0);
                productBatchId = src.getProductBatchId();
                if (productBatchId != null && productBatchRepository != null) {
                    productBatchCode = productBatchRepository.findById(productBatchId)
                            .map(ProductBatch::getBatchCode)
                            .orElse(null);
                }
            }
        }

        return HarvestRecordDetailResponse.builder()
                .id(record.getId())
                .farmId(record.getFarmId())
                .farmName(farmName)
                .harvestCode(record.getHarvestCode())
                .harvestDate(record.getHarvestDate())
                .sourceType(record.getSourceType())
                .seasonId(record.getSeasonId())
                .seasonCode(seasonCode)
                .cropTypeName(cropTypeName)
                .livestockGroupId(record.getLivestockGroupId())
                .groupCode(groupCode)
                .quantity(record.getQuantity())
                .unit(record.getUnit())
                .qualityGrade(record.getQualityGrade())
                .harvestedByUserId(record.getHarvestedByUserId())
                .harvestedByName(harvesterName)
                .notes(record.getNotes())
                .productBatchId(productBatchId)
                .productBatchCode(productBatchCode)
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
