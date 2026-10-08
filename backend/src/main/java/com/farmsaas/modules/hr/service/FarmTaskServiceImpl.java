package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.hr.dto.FarmTaskRequest;
import com.farmsaas.modules.hr.dto.FarmTaskResponse;
import com.farmsaas.modules.hr.dto.TaskStatusUpdateRequest;
import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.FarmTask;
import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import com.farmsaas.modules.hr.repository.EmployeeRepository;
import com.farmsaas.modules.hr.repository.FarmTaskRepository;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmTaskServiceImpl implements FarmTaskService {

    private final FarmTaskRepository farmTaskRepository;
    private final EmployeeRepository employeeRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public FarmTaskResponse createTask(Long farmId, FarmTaskRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        String taskCode = request.getTaskCode();
        if (taskCode == null || taskCode.isBlank()) {
            taskCode = generateTaskCode(tenantId, farmId);
        } else {
            taskCode = taskCode.trim().toUpperCase();
            if (farmTaskRepository.existsByTenantIdAndFarmIdAndTaskCode(tenantId, farmId, taskCode)) {
                throw new BusinessException("Mã công việc '" + taskCode + "' đã tồn tại trong trang trại.");
            }
        }

        Employee assignee = null;
        if (request.getAssignedTo() != null) {
            assignee = employeeRepository.findByIdAndTenantIdAndFarmId(request.getAssignedTo(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên được giao việc ID: " + request.getAssignedTo()));
        }

        Employee supervisor = null;
        if (request.getSupervisorId() != null) {
            supervisor = employeeRepository.findByIdAndTenantIdAndFarmId(request.getSupervisorId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người giám sát ID: " + request.getSupervisorId()));
        }

        CropSeason season = null;
        if (request.getSeasonId() != null) {
            season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(request.getSeasonId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + request.getSeasonId()));
        }

        LivestockGroup herd = null;
        if (request.getHerdId() != null) {
            herd = livestockGroupRepository.findByIdAndTenantIdAndFarmId(request.getHerdId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn vật nuôi ID: " + request.getHerdId()));
        }

        ProductionZone zone = null;
        if (request.getZoneId() != null) {
            zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID: " + request.getZoneId()));
        }

        FarmTask task = FarmTask.builder()
                .farmId(farmId)
                .taskCode(taskCode)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .assignedTo(request.getAssignedTo())
                .assignee(assignee)
                .supervisorId(request.getSupervisorId())
                .supervisor(supervisor)
                .seasonId(request.getSeasonId())
                .season(season)
                .herdId(request.getHerdId())
                .herd(herd)
                .zoneId(request.getZoneId())
                .zone(zone)
                .dueDate(request.getDueDate())
                .startTime(request.getStartTime())
                .completedAt(request.getCompletedAt())
                .estimatedHours(request.getEstimatedHours())
                .actualHours(request.getActualHours())
                .notes(request.getNotes())
                .build();
        task.setTenantId(tenantId);

        FarmTask saved = farmTaskRepository.save(task);
        log.info("Created task code: {} with ID: {} for Farm ID: {}", saved.getTaskCode(), saved.getId(), farmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public FarmTaskResponse updateTask(Long farmId, Long id, FarmTaskRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmTask task = farmTaskRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc ID: " + id));

        if (request.getTitle() != null) task.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());

        if (request.getAssignedTo() != null) {
            Employee assignee = employeeRepository.findByIdAndTenantIdAndFarmId(request.getAssignedTo(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên ID: " + request.getAssignedTo()));
            task.setAssignedTo(assignee.getId());
            task.setAssignee(assignee);
        }

        if (request.getSupervisorId() != null) {
            Employee supervisor = employeeRepository.findByIdAndTenantIdAndFarmId(request.getSupervisorId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người giám sát ID: " + request.getSupervisorId()));
            task.setSupervisorId(supervisor.getId());
            task.setSupervisor(supervisor);
        }

        if (request.getSeasonId() != null) task.setSeasonId(request.getSeasonId());
        if (request.getHerdId() != null) task.setHerdId(request.getHerdId());
        if (request.getZoneId() != null) task.setZoneId(request.getZoneId());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getStartTime() != null) task.setStartTime(request.getStartTime());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getActualHours() != null) task.setActualHours(request.getActualHours());
        if (request.getNotes() != null) task.setNotes(request.getNotes());

        if (task.getStatus() == TaskStatus.DONE && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        }

        FarmTask updated = farmTaskRepository.save(task);
        log.info("Updated task ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public FarmTaskResponse updateTaskStatus(Long farmId, Long id, TaskStatusUpdateRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmTask task = farmTaskRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc ID: " + id));

        task.setStatus(request.getStatus());
        if (request.getActualHours() != null) {
            task.setActualHours(request.getActualHours());
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String current = task.getNotes() != null ? task.getNotes() + "; " : "";
            task.setNotes(current + request.getNotes());
        }

        if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (request.getStatus() == TaskStatus.IN_PROGRESS && task.getStartTime() == null) {
            task.setStartTime(LocalDateTime.now());
        }

        FarmTask updated = farmTaskRepository.save(task);
        log.info("Task ID: {} status changed to: {}", id, request.getStatus());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmTaskResponse getTaskById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmTask task = farmTaskRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc ID: " + id));
        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmTaskResponse> searchTasks(Long farmId, String keyword, TaskStatus status, TaskPriority priority, Long assignedTo, Long seasonId, Long zoneId, Long herdId, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return farmTaskRepository.searchTasks(tenantId, farmId, keyword, status, priority, assignedTo, seasonId, zoneId, herdId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<TaskStatus, List<FarmTaskResponse>> getKanbanBoard(Long farmId, Long assignedTo) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        List<FarmTask> allTasks = farmTaskRepository.findAllKanbanTasks(tenantId, farmId, assignedTo);

        // Khởi tạo các nhóm trạng thái
        Map<TaskStatus, List<FarmTaskResponse>> kanbanMap = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            kanbanMap.put(status, new ArrayList<>());
        }

        for (FarmTask task : allTasks) {
            kanbanMap.get(task.getStatus()).add(mapToResponse(task));
        }

        return kanbanMap;
    }

    @Override
    @Transactional
    public void deleteTask(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmTask task = farmTaskRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc ID: " + id));

        farmTaskRepository.delete(task);
        log.info("Deleted farm task ID: {} from Farm ID: {}", id, farmId);
    }

    private String generateTaskCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "TSK-" + datePart + "-" + suffix;
        } while (farmTaskRepository.existsByTenantIdAndFarmIdAndTaskCode(tenantId, farmId, code));
        return code;
    }

    private FarmTaskResponse mapToResponse(FarmTask t) {
        return FarmTaskResponse.builder()
                .id(t.getId())
                .tenantId(t.getTenantId())
                .farmId(t.getFarmId())
                .taskCode(t.getTaskCode())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignedTo(t.getAssignedTo())
                .assigneeName(t.getAssignee() != null ? t.getAssignee().getFullName() : null)
                .supervisorId(t.getSupervisorId())
                .supervisorName(t.getSupervisor() != null ? t.getSupervisor().getFullName() : null)
                .seasonId(t.getSeasonId())
                .seasonCode(t.getSeason() != null ? t.getSeason().getSeasonCode() : null)
                .herdId(t.getHerdId())
                .herdCode(t.getHerd() != null ? t.getHerd().getGroupCode() : null)
                .zoneId(t.getZoneId())
                .zoneName(t.getZone() != null ? t.getZone().getName() : null)
                .dueDate(t.getDueDate())
                .startTime(t.getStartTime())
                .completedAt(t.getCompletedAt())
                .estimatedHours(t.getEstimatedHours())
                .actualHours(t.getActualHours())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
