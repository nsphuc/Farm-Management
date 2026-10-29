package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.request.UpdateTaskStatusRequest;
import com.farm.saas.modules.hr.dto.response.FarmTaskDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FarmTaskService {
    FarmTaskDetailResponse createTask(Long farmId, CreateFarmTaskRequest request);
    FarmTaskDetailResponse updateTask(Long farmId, Long taskId, CreateFarmTaskRequest request);
    FarmTaskDetailResponse updateTask(Long farmId, Long taskId, com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest request);
    void deleteTask(Long farmId, Long taskId);
    FarmTaskDetailResponse cancelTask(Long id, String reason);
    FarmTaskDetailResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request);
    Page<FarmTaskDetailResponse> getTasks(Long farmId, Pageable pageable);
    Page<FarmTaskDetailResponse> getTasks(Long farmId, String taskType, String status, Boolean isRoutine, Long zoneId, Long employeeId, String search, Pageable pageable);
    FarmTaskDetailResponse getTaskById(Long id);
    java.util.List<FarmTaskDetailResponse> generateDailyRoutines(Long farmId);
    int cancelPendingRoutineTasksForZone(Long farmId, Long zoneId, String reason);
}
