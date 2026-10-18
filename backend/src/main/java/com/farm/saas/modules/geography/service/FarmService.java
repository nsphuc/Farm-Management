package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.CreateFarmRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmRequest;
import com.farm.saas.modules.geography.dto.response.FarmDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FarmService {
    Page<FarmDetailResponse> getFarms(String farmType, String keyword, Pageable pageable);
    FarmDetailResponse getFarmById(Long id);
    FarmDetailResponse createFarm(CreateFarmRequest request);
    FarmDetailResponse updateFarm(Long id, UpdateFarmRequest request);
}
