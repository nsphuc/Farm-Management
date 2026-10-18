package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockEventRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import com.farm.saas.modules.quality.entity.HarvestRecord;
import com.farm.saas.modules.quality.repository.HarvestRecordRepository;
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

    @Override
    @Transactional
    public HarvestRecordDetailResponse createHarvestRecord(Long farmId, CreateHarvestRecordRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Strict XOR Source Validation (chk_harvest_records_source)
        if ("CROP_SEASON".equals(request.getSourceType())) {
            if (request.getSeasonId() == null || request.getLivestockGroupId() != null) {
                throw new BusinessException("INVALID_HARVEST_SOURCE", "Nguồn CROP_SEASON bắt buộc phải có seasonId và không được truyền livestockGroupId");
            }
        } else if ("LIVESTOCK_GROUP".equals(request.getSourceType())) {
            if (request.getLivestockGroupId() == null || request.getSeasonId() != null) {
                throw new BusinessException("INVALID_HARVEST_SOURCE", "Nguồn LIVESTOCK_GROUP bắt buộc phải có livestockGroupId và không được truyền seasonId");
            }
        } else {
            throw new BusinessException("INVALID_HARVEST_SOURCE", "sourceType phải là CROP_SEASON hoặc LIVESTOCK_GROUP");
        }

        // 2. PHI / Withdrawal Guard
        if ("CROP_SEASON".equals(request.getSourceType())) {
            CropSeason season = cropSeasonRepository.findById(request.getSeasonId())
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
            LivestockGroup group = livestockGroupRepository.findById(request.getLivestockGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("LivestockGroup", "id", request.getLivestockGroupId()));

            if (!group.getFarmId().equals(farmId) || !group.getTenantId().equals(tenantId)) {
                throw new BusinessException("GROUP_NOT_IN_FARM", "Đàn nuôi không thuộc trang trại này");
            }

            if ("QUARANTINED".equals(group.getStatus()) || "SOLD".equals(group.getStatus()) || "CULLED".equals(group.getStatus())) {
                throw new BusinessException("INVALID_GROUP_STATUS", "Đàn nuôi đang ở trạng thái không cho phép xuất chuồng: " + group.getStatus());
            }

            LocalDate maxWithdrawalEndDate = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
            if (maxWithdrawalEndDate != null && !request.getHarvestDate().isAfter(maxWithdrawalEndDate)) {
                log.warn("HARVEST_BLOCKED_BY_PHI: Group {} harvestDate {} <= maxWithdrawalEndDate {}", group.getId(), request.getHarvestDate(), maxWithdrawalEndDate);
                throw new BusinessException("HARVEST_BLOCKED_BY_PHI", "Đàn nuôi đang trong thời gian cách ly thuốc thú y (Withdrawal đến ngày " + maxWithdrawalEndDate + ")");
            }
        }

        // 3. Generate harvest code if omitted
        String harvestCode = request.getHarvestCode();
        if (!StringUtils.hasText(harvestCode)) {
            harvestCode = "HAR-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        String qualityGrade = StringUtils.hasText(request.getQualityGrade()) ? request.getQualityGrade() : "STANDARD";

        HarvestRecord record = HarvestRecord.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .harvestCode(harvestCode)
                .harvestDate(request.getHarvestDate())
                .sourceType(request.getSourceType())
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .qualityGrade(qualityGrade)
                .harvestedByUserId(request.getHarvestedByUserId() != null ? request.getHarvestedByUserId() : currentUserId)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        record = harvestRecordRepository.save(record);
        log.info("Saved harvest record id={}, code={} on farmId={}", record.getId(), record.getHarvestCode(), farmId);

        return mapToDetailResponse(record);
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
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
