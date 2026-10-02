package com.farmsaas.modules.crop.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.dto.CropSeasonRequest;
import com.farmsaas.modules.crop.dto.CropSeasonResponse;
import com.farmsaas.modules.crop.dto.HarvestSeasonRequest;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.entity.CropType;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.crop.repository.CropTypeRepository;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CropSeasonServiceImpl implements CropSeasonService {

    private final CropSeasonRepository cropSeasonRepository;
    private final CropTypeRepository cropTypeRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;

    @Override
    @Transactional
    public CropSeasonResponse createSeason(Long farmId, CropSeasonRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        CropType cropType = cropTypeRepository.findByIdAndTenantId(request.getCropTypeId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống cây trồng với ID: " + request.getCropTypeId()));

        String seasonCode = request.getSeasonCode();
        if (seasonCode == null || seasonCode.isBlank()) {
            seasonCode = generateSeasonCode(tenantId, farmId);
        } else {
            seasonCode = seasonCode.trim().toUpperCase();
            if (cropSeasonRepository.existsByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, seasonCode)) {
                throw new BusinessException("Mã vụ mùa '" + seasonCode + "' đã tồn tại trong trang trại này.");
            }
        }

        CropSeason season = CropSeason.builder()
                .farmId(farmId)
                .zoneId(zone.getId())
                .cropTypeId(cropType.getId())
                .seasonCode(seasonCode)
                .startDate(request.getStartDate())
                .expectedHarvestDate(request.getExpectedHarvestDate())
                .plantedAreaM2(request.getPlantedAreaM2())
                .seedQuantity(request.getSeedQuantity())
                .estimatedYieldKg(request.getEstimatedYieldKg())
                .status(request.getStatus() != null ? request.getStatus() : SeasonStatus.LAM_DAT)
                .build();
        season.setTenantId(tenantId);

        CropSeason saved = cropSeasonRepository.save(season);
        log.info("Created crop season '{}' (ID: {}) for Farm ID: {}, Tenant ID: {}", saved.getSeasonCode(), saved.getId(), farmId, tenantId);
        return CropSeasonResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CropSeasonResponse updateSeason(Long farmId, Long seasonId, CropSeasonRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        if (season.getStatus() == SeasonStatus.DONG_VU) {
            throw new BusinessException("Không thể chỉnh sửa vụ mùa đã đóng/kết thúc.");
        }

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        CropType cropType = cropTypeRepository.findByIdAndTenantId(request.getCropTypeId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống cây trồng với ID: " + request.getCropTypeId()));

        if (request.getSeasonCode() != null && !request.getSeasonCode().isBlank()) {
            String newCode = request.getSeasonCode().trim().toUpperCase();
            if (!season.getSeasonCode().equalsIgnoreCase(newCode) &&
                    cropSeasonRepository.existsByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, newCode)) {
                throw new BusinessException("Mã vụ mùa '" + newCode + "' đã tồn tại trong trang trại này.");
            }
            season.setSeasonCode(newCode);
        }

        season.setZoneId(zone.getId());
        season.setCropTypeId(cropType.getId());
        season.setStartDate(request.getStartDate());
        season.setExpectedHarvestDate(request.getExpectedHarvestDate());
        season.setPlantedAreaM2(request.getPlantedAreaM2());
        season.setSeedQuantity(request.getSeedQuantity());
        season.setEstimatedYieldKg(request.getEstimatedYieldKg());
        if (request.getStatus() != null) {
            season.setStatus(request.getStatus());
        }

        CropSeason updated = cropSeasonRepository.save(season);
        log.info("Updated crop season ID: {} for Farm ID: {}", seasonId, farmId);
        return CropSeasonResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CropSeasonResponse getSeasonById(Long farmId, Long seasonId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));
        return CropSeasonResponse.fromEntity(season);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CropSeasonResponse> searchSeasons(Long farmId, Long zoneId, Long cropTypeId, SeasonStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<CropSeason> page = cropSeasonRepository.searchSeasons(tenantId, farmId, zoneId, cropTypeId, status, pageable);
        return page.map(CropSeasonResponse::fromEntity);
    }

    @Override
    @Transactional
    public CropSeasonResponse harvestSeason(Long farmId, Long seasonId, HarvestSeasonRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        season.setActualHarvestDate(request.getActualHarvestDate());
        season.setActualYieldKg(request.getActualYieldKg());
        season.setStatus(request.isCloseSeason() ? SeasonStatus.DONG_VU : SeasonStatus.THU_HOACH);

        CropSeason saved = cropSeasonRepository.save(season);
        log.info("Harvested season ID: {} for Farm ID: {}. Actual yield: {} kg, status: {}",
                seasonId, farmId, request.getActualYieldKg(), saved.getStatus());
        return CropSeasonResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CropSeasonResponse updateStatus(Long farmId, Long seasonId, SeasonStatus status) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        season.setStatus(status);
        CropSeason saved = cropSeasonRepository.save(season);
        log.info("Updated status for season ID: {} to {}", seasonId, status);
        return CropSeasonResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteSeason(Long farmId, Long seasonId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        cropSeasonRepository.delete(season);
        log.info("Deleted crop season ID: {} from Farm ID: {}", seasonId, farmId);
    }

    private String generateSeasonCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "VU-" + datePart + "-" + suffix;
        } while (cropSeasonRepository.existsByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, code));
        return code;
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
