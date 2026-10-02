package com.farmsaas.modules.crop.service;

import com.farmsaas.modules.crop.dto.CropSeasonRequest;
import com.farmsaas.modules.crop.dto.CropSeasonResponse;
import com.farmsaas.modules.crop.dto.HarvestSeasonRequest;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CropSeasonService {

    CropSeasonResponse createSeason(Long farmId, CropSeasonRequest request);

    CropSeasonResponse updateSeason(Long farmId, Long seasonId, CropSeasonRequest request);

    CropSeasonResponse getSeasonById(Long farmId, Long seasonId);

    Page<CropSeasonResponse> searchSeasons(Long farmId, Long zoneId, Long cropTypeId, SeasonStatus status, Pageable pageable);

    CropSeasonResponse harvestSeason(Long farmId, Long seasonId, HarvestSeasonRequest request);

    CropSeasonResponse updateStatus(Long farmId, Long seasonId, SeasonStatus status);

    void deleteSeason(Long farmId, Long seasonId);
}
