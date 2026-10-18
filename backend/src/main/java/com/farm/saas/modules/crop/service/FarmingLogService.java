package com.farm.saas.modules.crop.service;

import com.farm.saas.modules.crop.dto.request.CreateFarmingLogRequest;
import com.farm.saas.modules.crop.dto.response.FarmingLogDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface FarmingLogService {
    Page<FarmingLogDetailResponse> getFarmingLogs(Long farmId, Long seasonId, LocalDate fromDate, LocalDate toDate, Pageable pageable);
    FarmingLogDetailResponse getFarmingLogById(Long farmId, Long id);
    FarmingLogDetailResponse createFarmingLog(Long farmId, CreateFarmingLogRequest request);
}
