package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.FarmTaskRequest;
import com.farmsaas.modules.hr.dto.FarmTaskResponse;
import com.farmsaas.modules.hr.dto.TaskStatusUpdateRequest;
import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface FarmTaskService {

    FarmTaskResponse createTask(Long farmId, FarmTaskRequest request);

    FarmTaskResponse updateTask(Long farmId, Long id, FarmTaskRequest request);

    FarmTaskResponse updateTaskStatus(Long farmId, Long id, TaskStatusUpdateRequest request);

    FarmTaskResponse getTaskById(Long farmId, Long id);

    Page<FarmTaskResponse> searchTasks(Long farmId, String keyword, TaskStatus status, TaskPriority priority, Long assignedTo, Long seasonId, Long zoneId, Long herdId, Pageable pageable);

    Map<TaskStatus, List<FarmTaskResponse>> getKanbanBoard(Long farmId, Long assignedTo);

    void deleteTask(Long farmId, Long id);
}
