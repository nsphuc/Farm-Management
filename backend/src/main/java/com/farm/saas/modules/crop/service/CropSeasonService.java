package com.farm.saas.modules.crop.service;

import com.farm.saas.modules.crop.dto.request.CreateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.request.UpdateCropSeasonRequest;
import com.farm.saas.modules.crop.dto.response.CropSeasonDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CropSeasonService {
    Page<CropSeasonDetailResponse> getSeasons(Long farmId, String status, String keyword, Pageable pageable);
    CropSeasonDetailResponse getSeasonById(Long farmId, Long id);
    CropSeasonDetailResponse createSeason(Long farmId, CreateCropSeasonRequest request);
    CropSeasonDetailResponse updateSeason(Long farmId, Long id, UpdateCropSeasonRequest request);
    CropSeasonDetailResponse closeSeason(Long farmId, Long id);
    void deleteSeason(Long farmId, Long id);
}
