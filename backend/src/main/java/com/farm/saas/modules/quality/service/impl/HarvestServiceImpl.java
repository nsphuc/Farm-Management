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
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.notification.service.NotificationService;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

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

    @Override
    @Transactional(readOnly = true)
    public Page<HarvestRecordDetailResponse> getHarvestRecords(Long farmId, Pageable pageable) {
        return harvestRecordRepository.findByFarmId(farmId, pageable).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public HarvestRecordDetailResponse getHarvestRecordById(Long farmId, Long id) {
        HarvestRecord record = harvestRecordRepository.findById(id)
                .filter(r -> r.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("HarvestRecord", "id", id));
        return mapToDetailResponse(record);
    }

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
