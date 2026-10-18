package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.request.UpdateTaskStatusRequest;
import com.farm.saas.modules.hr.dto.response.FarmTaskDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.FarmTask;
import com.farm.saas.modules.hr.entity.FarmTaskAssignee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.FarmTaskAssigneeRepository;
import com.farm.saas.modules.hr.repository.FarmTaskRepository;
import com.farm.saas.modules.hr.service.FarmTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmTaskServiceImpl implements FarmTaskService {

    private final FarmTaskRepository farmTaskRepository;
    private final FarmTaskAssigneeRepository farmTaskAssigneeRepository;
    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository zoneRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FarmTaskDetailResponse createTask(Long farmId, CreateFarmTaskRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Farm farm = farmRepository.findById(farmId)
                .filter(f -> f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        FarmTask task = FarmTask.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .zoneId(request.getZoneId())
                .taskTitle(request.getTaskTitle())
                .taskType(request.getTaskType())
                .priority(request.getPriority())
                .assignedToEmployeeId(request.getAssignedToEmployeeId())
                .assignedByUserId(currentUserId)
                .deadline(request.getDeadline())
                .status("TODO")
                .completionNotes(request.getCompletionNotes())
                .photosJson(request.getPhotosJson())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        task = farmTaskRepository.save(task);

        if (request.getAssignees() != null) {
            for (CreateFarmTaskRequest.TaskAssigneeItemRequest aReq : request.getAssignees()) {
                FarmTaskAssignee assignee = FarmTaskAssignee.builder()
                        .taskId(task.getId())
                        .tenantId(tenantId)
                        .employeeId(aReq.getEmployeeId())
                        .roleInTask(aReq.getRoleInTask() != null ? aReq.getRoleInTask() : "MEMBER")
                        .assignedAt(Instant.now())
                        .build();
                farmTaskAssigneeRepository.save(assignee);
            }
        }

        log.info("Created farm task id={}, title={} on farmId={}", task.getId(), task.getTaskTitle(), farmId);
        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        FarmTask task = farmTaskRepository.findById(id)
                .filter(t -> t.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", id));

        task.setStatus(request.getStatus());
        if (request.getCompletionNotes() != null) {
            task.setCompletionNotes(request.getCompletionNotes());
        }
        if (request.getPhotosJson() != null) {
            task.setPhotosJson(request.getPhotosJson());
        }
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(currentUserId);

        task = farmTaskRepository.save(task);
        log.info("Updated task id={} status to {}", task.getId(), task.getStatus());
        return enrichTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmTaskDetailResponse> getTasks(Long farmId, Pageable pageable) {
        return farmTaskRepository.findByFarmId(farmId, pageable).map(this::enrichTaskResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmTaskDetailResponse getTaskById(Long id) {
        FarmTask task = farmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", id));
        return enrichTaskResponse(task);
    }

    private FarmTaskDetailResponse enrichTaskResponse(FarmTask t) {
        String farmName = farmRepository.findById(t.getFarmId()).map(Farm::getName).orElse(null);
        String zoneName = t.getZoneId() != null ? zoneRepository.findById(t.getZoneId()).map(z -> z.getName()).orElse(null) : null;
        String assignedEmpName = null;
        if (t.getAssignedToEmployeeId() != null) {
            assignedEmpName = employeeRepository.findById(t.getAssignedToEmployeeId()).map(Employee::getFullName).orElse(null);
        }
        String assignerName = null;
        if (t.getAssignedByUserId() != null) {
            assignerName = userRepository.findById(t.getAssignedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        List<FarmTaskAssignee> assignees = farmTaskAssigneeRepository.findByTaskId(t.getId());
        List<FarmTaskDetailResponse.FarmTaskAssigneeResponse> assigneeResponses = new ArrayList<>();
        for (FarmTaskAssignee a : assignees) {
            Employee emp = employeeRepository.findById(a.getEmployeeId()).orElse(null);
            assigneeResponses.add(FarmTaskDetailResponse.FarmTaskAssigneeResponse.builder()
                    .employeeId(a.getEmployeeId())
                    .employeeName(emp != null ? emp.getFullName() : null)
                    .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                    .roleInTask(a.getRoleInTask())
                    .assignedAt(a.getAssignedAt())
                    .build());
        }

        return FarmTaskDetailResponse.builder()
                .id(t.getId())
                .farmId(t.getFarmId())
                .farmName(farmName)
                .zoneId(t.getZoneId())
                .zoneName(zoneName)
                .taskTitle(t.getTaskTitle())
                .taskType(t.getTaskType())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignedToEmployeeId(t.getAssignedToEmployeeId())
                .assignedToEmployeeName(assignedEmpName)
                .assignedByUserId(t.getAssignedByUserId())
                .assignedByName(assignerName)
                .deadline(t.getDeadline())
                .completionNotes(t.getCompletionNotes())
                .photosJson(t.getPhotosJson())
                .assignees(assigneeResponses)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
