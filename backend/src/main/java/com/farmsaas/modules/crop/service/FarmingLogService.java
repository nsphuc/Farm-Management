package com.farmsaas.modules.crop.service;

import com.farmsaas.modules.crop.dto.FarmingLogRequest;
import com.farmsaas.modules.crop.dto.FarmingLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FarmingLogService {

    FarmingLogResponse createLog(Long farmId, Long seasonId, FarmingLogRequest request);

    FarmingLogResponse getLogById(Long farmId, Long seasonId, Long logId);

    Page<FarmingLogResponse> getLogsBySeason(Long farmId, Long seasonId, Pageable pageable);

    void deleteLog(Long farmId, Long seasonId, Long logId);
}
