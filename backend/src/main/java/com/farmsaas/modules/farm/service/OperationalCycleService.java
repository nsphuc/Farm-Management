package com.farmsaas.modules.farm.service;

import com.farmsaas.modules.farm.dto.*;

import java.util.List;

public interface OperationalCycleService {

    List<CycleResponse> getCyclesByFarmId(Long farmId);

    CycleResponse createCycle(Long farmId, CreateCycleRequest request);

    CycleResponse updateCycle(Long farmId, Long cycleId, UpdateCycleRequest request);

    CycleResponse updateCycleStatus(Long farmId, Long cycleId, String status);

    void deleteCycle(Long farmId, Long cycleId);

    // Settings
    FarmSettingResponse getFarmSettings(Long farmId);

    FarmSettingResponse updateFarmSettings(Long farmId, FarmSettingRequest request);
}
