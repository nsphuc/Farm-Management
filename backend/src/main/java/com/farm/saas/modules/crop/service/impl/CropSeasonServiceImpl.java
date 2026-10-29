package com.farm.saas.modules.crop.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.crop.dto.request.CreateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.request.UpdateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.response.CropSeasonDetailResponse;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.crop.service.CropSeasonService;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CropSeasonServiceImpl implements CropSeasonService {

    private final CropSeasonRepository cropSeasonRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final OperationalCycleRepository operationalCycleRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final CropTypeRepository cropTypeRepository;
    private final com.farm.saas.modules.hr.service.FarmTaskService farmTaskService;

    @Override
    @Transactional(readOnly = true)
    public Page<CropSeasonDetailResponse> getSeasons(Long farmId, String status, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<CropSeason> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates = cb.and(predicates, cb.equal(root.get("farmId"), farmId));
            predicates = cb.and(predicates, cb.equal(root.get("tenantId"), tenantId));

            if (StringUtils.hasText(status)) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(keyword)) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("seasonCode")), "%" + keyword.toLowerCase() + "%"));
            }
            return predicates;
        };

        return cropSeasonRepository.findAll(spec, pageable).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CropSeasonDetailResponse getSeasonById(Long farmId, Long id) {
        CropSeason season = findSeasonOrThrow(farmId, id);
        return mapToDetailResponse(season);
    }

    @Override
    @Transactional
    public CropSeasonDetailResponse createSeason(Long farmId, CreateCropSeasonRequest request) {
        final Long tenantId = (SecurityUtils.getCurrentTenantId() != null)
                ? SecurityUtils.getCurrentTenantId()
                : productionZoneRepository.findById(request.getZoneId())
                        .map(ProductionZone::getTenantId)
                        .orElse(1L);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        String seasonCode = request.getSeasonCode();
        if (!StringUtils.hasText(seasonCode)) {
            seasonCode = "CS-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        if (cropSeasonRepository.existsByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, seasonCode)) {
            throw new BusinessException("DUPLICATE_SEASON_CODE", "Mã vụ mùa đã tồn tại: " + seasonCode);
        }

        CropSeason season = CropSeason.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(request.getZoneId())
                .operationalCycleId(request.getOperationalCycleId())
                .seasonCode(seasonCode)
                .cropTypeId(request.getCropTypeId())
                .startDate(request.getStartDate())
                .expectedHarvestDate(request.getExpectedHarvestDate())
                .plantedAreaM2(request.getPlantedAreaM2())
                .seedQuantity(request.getSeedQuantity())
                .estimatedYieldKg(request.getEstimatedYieldKg())
                .status("SOIL_PREPARATION")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        season = cropSeasonRepository.save(season);

        // Đồng bộ zone_locations sang OCCUPIED
        if (request.getLocationId() != null) {
            zoneLocationRepository.findById(request.getLocationId()).ifPresent(loc -> {
                if (Objects.equals(loc.getZoneId(), request.getZoneId()) && (tenantId == null || tenantId.equals(loc.getTenantId()))) {
                    loc.setStatus("OCCUPIED");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            });
        } else if (request.getZoneId() != null) {
            var locs = zoneLocationRepository.findByZoneId(request.getZoneId());
            if (locs.size() == 1 && "EMPTY".equalsIgnoreCase(locs.get(0).getStatus())) {
                var singleLoc = locs.get(0);
                singleLoc.setStatus("OCCUPIED");
                singleLoc.setUpdatedAt(Instant.now());
                zoneLocationRepository.save(singleLoc);
            }
        }

        log.info("Created crop season id={}, code={} on farmId={}", season.getId(), season.getSeasonCode(), farmId);
        return mapToDetailResponse(season);
    }

    @Override
    @Transactional
    public CropSeasonDetailResponse updateSeason(Long farmId, Long id, UpdateCropSeasonRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropSeason season = findSeasonOrThrow(farmId, id);

        if ("CLOSED".equals(season.getStatus()) || "CANCELLED".equals(season.getStatus())) {
            throw new BusinessException("SEASON_ALREADY_CLOSED", "Không thể chỉnh sửa vụ mùa đã đóng hoặc đã hủy");
        }

        final Long targetZoneId = season.getZoneId();
        if (request.getLocationId() != null) {
            zoneLocationRepository.findById(request.getLocationId()).ifPresent(loc -> {
                if (Objects.equals(loc.getZoneId(), targetZoneId) && (tenantId == null || tenantId.equals(loc.getTenantId()))) {
                    loc.setStatus("OCCUPIED");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            });
        }
        if (request.getExpectedHarvestDate() != null) {
            season.setExpectedHarvestDate(request.getExpectedHarvestDate());
        }
        if (request.getActualHarvestDate() != null) {
            season.setActualHarvestDate(request.getActualHarvestDate());
        }
        if (request.getActualYieldKg() != null) {
            season.setActualYieldKg(request.getActualYieldKg());
        }
        boolean wasClosed = "CLOSED".equalsIgnoreCase(season.getStatus()) || "CANCELLED".equalsIgnoreCase(season.getStatus());
        if (StringUtils.hasText(request.getStatus())) {
            season.setStatus(request.getStatus());
        }

        season.setUpdatedAt(Instant.now());
        season.setUpdatedBy(SecurityUtils.getCurrentUserId());
        season = cropSeasonRepository.save(season);

        if (!wasClosed && ("CLOSED".equalsIgnoreCase(season.getStatus()) || "CANCELLED".equalsIgnoreCase(season.getStatus()))) {
            farmTaskService.cancelPendingRoutineTasksForZone(farmId, season.getZoneId(), "Tự động kết thúc do đã thu hoạch / xuất chuồng");
            releaseZoneLocationsIfEmpty(tenantId, farmId, season.getZoneId());
        }

        return mapToDetailResponse(season);
    }

    @Override
    @Transactional
    public CropSeasonDetailResponse closeSeason(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropSeason season = findSeasonOrThrow(farmId, id);

        if ("CLOSED".equals(season.getStatus()) || "CANCELLED".equals(season.getStatus())) {
            throw new BusinessException("SEASON_ALREADY_CLOSED", "Vụ mùa đã ở trạng thái kết thúc: " + season.getStatus());
        }

        season.setStatus("CLOSED");
        if (season.getActualHarvestDate() == null) {
            season.setActualHarvestDate(LocalDate.now());
        }
        season.setUpdatedAt(Instant.now());
        season.setUpdatedBy(SecurityUtils.getCurrentUserId());
        season = cropSeasonRepository.save(season);

        farmTaskService.cancelPendingRoutineTasksForZone(farmId, season.getZoneId(), "Tự động kết thúc do đã thu hoạch / xuất chuồng");
        releaseZoneLocationsIfEmpty(tenantId, farmId, season.getZoneId());

        log.info("Closed crop season id={} on farmId={}", season.getId(), farmId);
        return mapToDetailResponse(season);
    }

    private CropSeason findSeasonOrThrow(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return cropSeasonRepository.findByFarmIdAndId(farmId, id)
                .filter(s -> tenantId == null || tenantId.equals(s.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("CropSeason", id));
    }

    private CropSeasonDetailResponse mapToDetailResponse(CropSeason season) {
        String zoneName = null;
        if (season.getZoneId() != null) {
            zoneName = productionZoneRepository.findById(season.getZoneId())
                    .map(z -> z.getName())
                    .orElse(null);
        }

        String cycleName = null;
        if (season.getOperationalCycleId() != null) {
            cycleName = operationalCycleRepository.findById(season.getOperationalCycleId())
                    .map(c -> c.getName())
                    .orElse(null);
        }

        String cropTypeName = null;
        if (season.getCropTypeId() != null) {
            cropTypeName = cropTypeRepository.findById(season.getCropTypeId())
                    .map(c -> c.getName())
                    .orElse(null);
        }

        LocalDate activePhiEndDate = farmingLogRepository.findMaxPhiEndDateBySeasonId(season.getId());
        boolean isInPhiQuarantine = activePhiEndDate != null && !LocalDate.now().isAfter(activePhiEndDate);
        BigDecimal totalExpenses = farmExpenseRepository.sumConfirmedExpensesBySeasonId(season.getId());
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        return CropSeasonDetailResponse.builder()
                .id(season.getId())
                .farmId(season.getFarmId())
                .zoneId(season.getZoneId())
                .zoneName(zoneName)
                .operationalCycleId(season.getOperationalCycleId())
                .cycleName(cycleName)
                .seasonCode(season.getSeasonCode())
                .cropTypeId(season.getCropTypeId())
                .cropTypeName(cropTypeName)
                .startDate(season.getStartDate())
                .expectedHarvestDate(season.getExpectedHarvestDate())
                .actualHarvestDate(season.getActualHarvestDate())
                .plantedAreaM2(season.getPlantedAreaM2())
                .seedQuantity(season.getSeedQuantity())
                .estimatedYieldKg(season.getEstimatedYieldKg())
                .actualYieldKg(season.getActualYieldKg())
                .status(season.getStatus())
                .activePhiEndDate(activePhiEndDate)
                .isInPhiQuarantine(isInPhiQuarantine)
                .totalExpensesAmount(totalExpenses)
                .createdAt(season.getCreatedAt())
                .updatedAt(season.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteSeason(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropSeason season = cropSeasonRepository.findById(id)
                .filter(s -> Objects.equals(s.getFarmId(), farmId))
                .filter(s -> tenantId == null || Objects.equals(s.getTenantId(), tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("CropSeason", id));

        season.setStatus("CLOSED");
        season.setUpdatedAt(Instant.now());
        season.setUpdatedBy(SecurityUtils.getCurrentUserId());
        cropSeasonRepository.save(season);

        farmTaskService.cancelPendingRoutineTasksForZone(farmId, season.getZoneId(), "Tự động kết thúc do đã thu hoạch / xuất chuồng");
        releaseZoneLocationsIfEmpty(tenantId, farmId, season.getZoneId());
    }

    private void releaseZoneLocationsIfEmpty(Long tenantId, Long farmId, Long zoneId) {
        if (zoneId == null) return;
        boolean hasActiveSeasons = cropSeasonRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("farmId"), farmId),
                cb.equal(root.get("zoneId"), zoneId),
                cb.not(root.get("status").in("CLOSED", "CANCELLED"))
        )).stream().findAny().isPresent();

        boolean hasActiveGroups = livestockGroupRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("farmId"), farmId),
                cb.equal(root.get("zoneId"), zoneId),
                cb.not(root.get("status").in("SOLD", "CLOSED", "CULLED"))
        )).stream().findAny().isPresent();

        if (!hasActiveSeasons && !hasActiveGroups) {
            var locs = zoneLocationRepository.findByZoneId(zoneId);
            for (var loc : locs) {
                if ("OCCUPIED".equalsIgnoreCase(loc.getStatus())) {
                    loc.setStatus("EMPTY");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            }
            log.info("Released zone locations for zoneId={} back to EMPTY", zoneId);
        }
    }
}
