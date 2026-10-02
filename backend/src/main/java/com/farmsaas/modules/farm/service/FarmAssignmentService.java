package com.farmsaas.modules.farm.service;

import com.farmsaas.modules.farm.dto.AssignmentResponse;
import com.farmsaas.modules.farm.dto.CreateAssignmentRequest;

import java.util.List;

public interface FarmAssignmentService {

    List<AssignmentResponse> getAssignmentsByFarmId(Long farmId);

    AssignmentResponse createAssignment(Long farmId, CreateAssignmentRequest request);

    void revokeAssignment(Long farmId, Long assignmentId);
}
