package com.farmsaas.modules.farm.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.FarmSummaryResponse;
import com.farmsaas.modules.farm.dto.UpdateFarmRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FarmService {

    PageResponse<FarmResponse> getFarms(String keyword, String status, String farmType, Pageable pageable);

    List<FarmSummaryResponse> getMyAccessibleFarms();

    FarmResponse getFarmById(Long id);

    FarmResponse createFarm(CreateFarmRequest request);

    FarmResponse updateFarm(Long id, UpdateFarmRequest request);

    void deleteFarm(Long id);
}
