package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.request.UpdateTaskStatusRequest;
import com.farm.saas.modules.hr.dto.response.FarmTaskDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FarmTaskService {
    FarmTaskDetailResponse createTask(Long farmId, CreateFarmTaskRequest request);
    FarmTaskDetailResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request);
    Page<FarmTaskDetailResponse> getTasks(Long farmId, Pageable pageable);
    FarmTaskDetailResponse getTaskById(Long id);
}
