package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest;
import com.farm.saas.modules.geography.dto.request.CreateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.request.UpdateFarmSettingsRequest;
import com.farm.saas.modules.geography.dto.request.UpdateOperationalCycleRequest;
import com.farm.saas.modules.geography.dto.response.FarmAssignmentResponse;
import com.farm.saas.modules.geography.dto.response.FarmOperationalSettingResponse;
import com.farm.saas.modules.geography.dto.response.OperationalCycleResponse;

import java.util.List;

public interface FarmOperationsService {
    List<FarmAssignmentResponse> getAssignments(Long farmId);
    FarmAssignmentResponse createAssignment(Long farmId, CreateFarmAssignmentRequest request);
    void deleteAssignment(Long farmId, Long assignmentId);
    default void deleteAssignment(Long farmId, Long assignmentId, Long employeeId) {
        deleteAssignment(farmId, assignmentId);
    }

    List<OperationalCycleResponse> getCycles(Long farmId);
    OperationalCycleResponse createCycle(Long farmId, CreateOperationalCycleRequest request);
    OperationalCycleResponse updateCycle(Long farmId, Long cycleId, UpdateOperationalCycleRequest request);
    void deleteCycle(Long farmId, Long cycleId);

    FarmOperationalSettingResponse getSettings(Long farmId);
    FarmOperationalSettingResponse updateSettings(Long farmId, UpdateFarmSettingsRequest request);
}
