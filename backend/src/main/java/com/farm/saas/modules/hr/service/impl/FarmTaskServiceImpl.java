package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.common.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.FarmAssignment;
import com.farm.saas.modules.geography.repository.FarmAssignmentRepository;
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
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FarmTaskServiceImpl implements FarmTaskService {

    private final FarmTaskRepository farmTaskRepository;
    private final FarmTaskAssigneeRepository farmTaskAssigneeRepository;
    private final EmployeeRepository employeeRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository zoneRepository;
    private final UserRepository userRepository;
    private final com.farm.saas.modules.notification.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired
    public FarmTaskServiceImpl(
            FarmTaskRepository farmTaskRepository,
            FarmTaskAssigneeRepository farmTaskAssigneeRepository,
            EmployeeRepository employeeRepository,
            FarmRepository farmRepository,
            ProductionZoneRepository zoneRepository,
            UserRepository userRepository,
            com.farm.saas.modules.notification.service.NotificationService notificationService) {
        this.farmTaskRepository = farmTaskRepository;
        this.farmTaskAssigneeRepository = farmTaskAssigneeRepository;
        this.employeeRepository = employeeRepository;
        this.farmRepository = farmRepository;
        this.zoneRepository = zoneRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public FarmTaskServiceImpl(
            FarmTaskRepository farmTaskRepository,
            FarmTaskAssigneeRepository farmTaskAssigneeRepository,
            EmployeeRepository employeeRepository,
            FarmRepository farmRepository,
            ProductionZoneRepository zoneRepository,
            UserRepository userRepository) {
        this(farmTaskRepository, farmTaskAssigneeRepository, employeeRepository, farmRepository, zoneRepository, userRepository, null);
    }


    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.common.security.FarmSecurityEvaluator farmSecurity;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FarmAssignmentRepository farmAssignmentRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.livestock.repository.LivestockGroupRepository livestockGroupRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.masterdata.repository.WarehouseRepository warehouseRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository warehouseInventoryRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.inventory.repository.WarehouseIssueRepository warehouseIssueRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.inventory.repository.WarehouseIssueItemRepository warehouseIssueItemRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.inventory.service.InventoryService inventoryService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.masterdata.repository.MaterialRepository materialRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.masterdata.repository.CostCategoryRepository costCategoryRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.finance.repository.FarmExpenseRepository farmExpenseRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.geography.repository.ZoneLocationRepository zoneLocationRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.crop.repository.CropSeasonRepository cropSeasonRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.masterdata.repository.WorkShiftRepository workShiftRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.hr.repository.ShiftAssignmentRepository shiftAssignmentRepository;

    private java.util.Set<Long> resolveFarmManagerUserIds(Farm farm) {
        java.util.Set<Long> managerIds = new java.util.HashSet<>();
        if (farm != null) {
            if (farm.getManagerUserId() != null) {
                managerIds.add(farm.getManagerUserId());
            }
            if (farmAssignmentRepository != null) {
                try {
                    farmAssignmentRepository.findByFarmIdAndIsActiveTrue(farm.getId())
                            .stream()
                            .filter(a -> "FARM_MANAGER".equalsIgnoreCase(a.getRoleInFarm()) && a.getUserId() != null && a.getUserId() > 0)
                            .forEach(a -> managerIds.add(a.getUserId()));
                } catch (Exception ex) {
                    log.warn("Failed resolving farm manager assignments: {}", ex.getMessage());
                }
            }
        }
        return managerIds;
    }

    /**
     * Xác thực phân quyền phân khu:
     * Nếu user là Zone Manager (không phải Super Admin, Farm Owner hoặc Farm Manager):
     * 1. Bắt buộc phải chọn zoneId và zoneId phải thuộc các phân khu do họ phụ trách.
     * 2. Mọi nhân viên được phân công phải thuộc phân khu đó.
     */
    private void validateZoneManagerScope(Long farmId, Long zoneId, Long assignedToEmployeeId, List<CreateFarmTaskRequest.TaskAssigneeItemRequest> assignees) {
        if (farmSecurity == null || farmId == null) {
            return;
        }
        if (farmSecurity.isFarmManagerOrOwner(farmId)) {
            return; // Toàn quyền cấp Farm
        }

        Set<Long> managedZoneIds = farmSecurity.getManagedZoneIds(farmId);
        if (farmSecurity.isZoneManager(farmId) || !managedZoneIds.isEmpty()) {
            if (managedZoneIds.isEmpty()) {
                throw new AccessDeniedException("Bạn chưa được phân công phụ trách phân khu nào tại trang trại này để giao việc.");
            }
            if (zoneId == null || !managedZoneIds.contains(zoneId)) {
                throw new AccessDeniedException("Bạn chỉ có quyền giao việc tại các phân khu mà bạn được phân công phụ trách.");
            }

            Set<Long> assigneeEmpIds = new HashSet<>();
            if (assignedToEmployeeId != null) {
                assigneeEmpIds.add(assignedToEmployeeId);
            }
            if (assignees != null) {
                for (CreateFarmTaskRequest.TaskAssigneeItemRequest aReq : assignees) {
                    if (aReq.getEmployeeId() != null) {
                        assigneeEmpIds.add(aReq.getEmployeeId());
                    }
                }
            }

            Long currentUserId = SecurityUtils.getCurrentUserId();
            for (Long empId : assigneeEmpIds) {
                Employee emp = employeeRepository.findById(empId)
                        .filter(e -> Objects.equals(e.getFarmId(), farmId))
                        .orElseThrow(() -> new BusinessException("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân sự có id=" + empId + " trong trang trại này"));

                boolean belongsToZone = false;
                if (emp.getUserId() != null && emp.getUserId().equals(currentUserId)) {
                    belongsToZone = true;
                }

                if (!belongsToZone && farmAssignmentRepository != null && emp.getUserId() != null) {
                    List<FarmAssignment> activeAssignments = farmAssignmentRepository.findByFarmIdAndIsActiveTrue(farmId);
                    boolean hasAssignAtZone = activeAssignments.stream().anyMatch(a ->
                            a.getUserId().equals(emp.getUserId()) && Objects.equals(a.getZoneId(), zoneId)
                    );
                    if (hasAssignAtZone) {
                        belongsToZone = true;
                    }
                }

                if (!belongsToZone && emp.getDepartment() != null) {
                    ProductionZone pZone = zoneRepository.findById(zoneId).orElse(null);
                    if (pZone != null) {
                        String dept = emp.getDepartment().trim().toLowerCase();
                        String zName = pZone.getName().trim().toLowerCase();
                        if (dept.contains(zName) || zName.contains(dept)) {
                            belongsToZone = true;
                        }
                    }
                }

                if (!belongsToZone) {
                    throw new AccessDeniedException("Nhân viên [" + emp.getFullName() + "] không thuộc phân khu bạn phụ trách. Bạn chỉ được phân công cho nhân sự trong phân khu của mình.");
                }
            }
        }
    }


    @Override
    @Transactional
    public FarmTaskDetailResponse createTask(Long farmId, CreateFarmTaskRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Farm farm = farmRepository.findById(farmId)
                .filter(f -> tenantId == null || f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        validateZoneManagerScope(farmId, request.getZoneId(), request.getAssignedToEmployeeId(), request.getAssignees());

        FarmTask task = FarmTask.builder()
                .tenantId(farm.getTenantId())
                .farmId(farm.getId())
                .zoneId(request.getZoneId())
                .locationId(request.getLocationId())
                .taskTitle(request.getTaskTitle())
                .taskType(request.getTaskType())
                .priority(request.getPriority())
                .assignedToEmployeeId(request.getAssignedToEmployeeId())
                .assignedByUserId(currentUserId)
                .shiftId(request.getShiftId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .recurrenceDays(request.getRecurrenceDays() != null ? request.getRecurrenceDays() : "ALL")
                .assignmentMode(request.getAssignmentMode() != null ? request.getAssignmentMode() : "FIXED")
                .warehouseId(request.getWarehouseId())
                .materialId(request.getMaterialId())
                .standardQuantity(request.getStandardQuantity())
                .actualQuantity(request.getActualQuantity())
                .cropSeasonId(request.getCropSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
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
                        .tenantId(farm.getTenantId())
                        .employeeId(aReq.getEmployeeId())
                        .roleInTask(aReq.getRoleInTask() != null ? aReq.getRoleInTask() : "MEMBER")
                        .assignedAt(Instant.now())
                        .build();
                farmTaskAssigneeRepository.save(assignee);
            }
        }

        log.info("Created farm task id={}, title={} on farmId={}", task.getId(), task.getTaskTitle(), farmId);

        // Bắn Notification tới các công nhân được giao việc
        if (notificationService != null) {
            try {
                Set<Long> targetUserIds = new HashSet<>();
                if (task.getAssignedToEmployeeId() != null) {
                    employeeRepository.findById(task.getAssignedToEmployeeId())
                            .map(Employee::getUserId)
                            .filter(uid -> uid != null && !uid.equals(currentUserId))
                            .ifPresent(targetUserIds::add);
                }
                if (request.getAssignees() != null) {
                    for (CreateFarmTaskRequest.TaskAssigneeItemRequest aReq : request.getAssignees()) {
                        if (aReq.getEmployeeId() != null) {
                            employeeRepository.findById(aReq.getEmployeeId())
                                    .map(Employee::getUserId)
                                    .filter(uid -> uid != null && !uid.equals(currentUserId))
                                    .ifPresent(targetUserIds::add);
                        }
                    }
                }
                String notifTitle = "Nhiệm vụ mới được giao: " + task.getTaskTitle();
                String notifMsg = "Bạn vừa được phân công nhiệm vụ [" + task.getTaskTitle() + "]. Hạn hoàn thành: " + (task.getDeadline() != null ? task.getDeadline() : "Không thời hạn");
                for (Long rId : targetUserIds) {
                    notificationService.sendNotification(
                            task.getTenantId(),
                            rId,
                            notifTitle,
                            notifMsg,
                            "TASK",
                            "FARM_TASK",
                            task.getId(),
                            "/app/my-dashboard"
                    );
                }

                // Gửi thông báo công việc phát sinh tới Farm Manager (nếu người tạo task không phải là Farm Manager)
                java.util.Set<Long> managerIds = resolveFarmManagerUserIds(farm);
                for (Long mId : managerIds) {
                    if (!mId.equals(currentUserId)) {
                        notificationService.sendNotification(
                                task.getTenantId(),
                                mId,
                                "Công việc phát sinh mới: " + task.getTaskTitle(),
                                String.format("Công việc phát sinh [%s] vừa được tạo tại trang trại. Mức ưu tiên: %s.",
                                        task.getTaskTitle(), task.getPriority() != null ? task.getPriority() : "Bình thường"),
                                "TASK",
                                "FARM_TASK",
                                task.getId(),
                                "/app/my-dashboard"
                        );
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to send task assignment notification: {}", ex.getMessage());
            }
        }

        if ("IN_PROGRESS".equalsIgnoreCase(task.getStatus()) && inventoryService != null && task.getMaterialId() != null && task.getStandardQuantity() != null && task.getStandardQuantity().compareTo(java.math.BigDecimal.ZERO) > 0) {
            try {
                inventoryService.autoCreateIssueDraftForTask(task.getFarmId(), task.getId(), currentUserId);
            } catch (Exception ex) {
                log.warn("Failed auto dispatching warehouse issue for created in-progress task id={}: {}", task.getId(), ex.getMessage());
            }
        }

        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse updateTask(Long farmId, Long taskId, CreateFarmTaskRequest request) {
        com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest updateReq = com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest.builder()
                .zoneId(request.getZoneId())
                .locationId(request.getLocationId())
                .taskTitle(request.getTaskTitle())
                .taskType(request.getTaskType())
                .priority(request.getPriority())
                .shiftId(request.getShiftId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .recurrenceDays(request.getRecurrenceDays())
                .assignmentMode(request.getAssignmentMode())
                .warehouseId(request.getWarehouseId())
                .materialId(request.getMaterialId())
                .standardQuantity(request.getStandardQuantity())
                .actualQuantity(request.getActualQuantity())
                .cropSeasonId(request.getCropSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .assignedToEmployeeId(request.getAssignedToEmployeeId())
                .deadline(request.getDeadline())
                .completionNotes(request.getCompletionNotes())
                .photosJson(request.getPhotosJson())
                .assignees(request.getAssignees())
                .build();
        return updateTask(farmId, taskId, updateReq);
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse updateTask(Long farmId, Long taskId, com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        FarmTask task = farmTaskRepository.findById(taskId)
                .filter(t -> (farmId == null || t.getFarmId().equals(farmId)) && (tenantId == null || t.getTenantId().equals(tenantId)))
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", taskId));

        if (farmSecurity != null && !farmSecurity.canAccessFarm(task.getFarmId())) {
            throw new AccessDeniedException("Không có quyền chỉnh sửa nhiệm vụ trên trang trại này.");
        }

        validateZoneManagerScope(task.getFarmId(), request.getZoneId(), request.getAssignedToEmployeeId(), request.getAssignees());

        if ("DONE".equalsIgnoreCase(task.getStatus())) {
            throw new com.farm.saas.common.exception.BusinessException("TASK_ALREADY_DONE", "Nhiệm vụ đã hoàn thành (DONE) không thể chỉnh sửa.");
        }
        if ("CANCELLED".equalsIgnoreCase(task.getStatus())) {
            throw new com.farm.saas.common.exception.BusinessException("TASK_ALREADY_CANCELLED", "Nhiệm vụ đã bị hủy (CANCELLED) không thể chỉnh sửa.");
        }

        task.setTaskTitle(request.getTaskTitle());
        task.setTaskType(request.getTaskType());
        task.setPriority(request.getPriority());
        task.setZoneId(request.getZoneId());
        task.setLocationId(request.getLocationId());
        task.setAssignedToEmployeeId(request.getAssignedToEmployeeId());
        task.setShiftId(request.getShiftId());
        if (request.getRecurrenceDays() != null) {
            task.setRecurrenceDays(request.getRecurrenceDays());
        }
        if (request.getAssignmentMode() != null) {
            task.setAssignmentMode(request.getAssignmentMode());
        }
        task.setWarehouseId(request.getWarehouseId());
        task.setMaterialId(request.getMaterialId());
        task.setStandardQuantity(request.getStandardQuantity());
        task.setActualQuantity(request.getActualQuantity());
        task.setCropSeasonId(request.getCropSeasonId());
        task.setLivestockGroupId(request.getLivestockGroupId());
        task.setDeadline(request.getDeadline());
        if (request.getCompletionNotes() != null) {
            task.setCompletionNotes(request.getCompletionNotes());
        }
        if (request.getPhotosJson() != null) {
            task.setPhotosJson(request.getPhotosJson());
        }
        if (request.getActualQuantity() != null) {
            task.setActualQuantity(request.getActualQuantity());
        }
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(currentUserId);

        task = farmTaskRepository.save(task);

        if (request.getAssignees() != null) {
            farmTaskAssigneeRepository.deleteByTaskId(task.getId());
            for (CreateFarmTaskRequest.TaskAssigneeItemRequest aReq : request.getAssignees()) {
                FarmTaskAssignee assignee = FarmTaskAssignee.builder()
                        .taskId(task.getId())
                        .tenantId(task.getTenantId())
                        .employeeId(aReq.getEmployeeId())
                        .roleInTask(aReq.getRoleInTask() != null ? aReq.getRoleInTask() : "MEMBER")
                        .assignedAt(Instant.now())
                        .build();
                farmTaskAssigneeRepository.save(assignee);
            }
        }

        log.info("Updated farm task id={}, title={} on farmId={}", task.getId(), task.getTaskTitle(), task.getFarmId());
        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse cancelTask(Long id, String reason) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        FarmTask task = farmTaskRepository.findById(id)
                .filter(t -> tenantId == null || t.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", id));

        if (farmSecurity != null && !farmSecurity.canAccessFarm(task.getFarmId())) {
            throw new AccessDeniedException("Không có quyền hủy nhiệm vụ trên trang trại này.");
        }

        if ("DONE".equalsIgnoreCase(task.getStatus())) {
            throw new com.farm.saas.common.exception.BusinessException("TASK_ALREADY_DONE", "Nhiệm vụ đã hoàn thành (DONE) không thể hủy.");
        }

        task.setStatus("CANCELLED");
        if (StringUtils.hasText(reason)) {
            task.setCompletionNotes(reason.trim());
        } else if (!StringUtils.hasText(task.getCompletionNotes())) {
            task.setCompletionNotes("Đã dừng / hủy nhiệm vụ bởi người điều hành");
        }
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(currentUserId);

        task = farmTaskRepository.save(task);
        log.info("Cancelled farm task id={} with reason='{}'", id, reason);
        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(Long farmId, Long taskId) {
        cancelTask(taskId, "Đã xóa / hủy nhiệm vụ bởi người điều hành");
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();

        FarmTask task = farmTaskRepository.findById(id)
                .filter(t -> tenantId == null || t.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", id));

        String targetStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "";
        String oldStatus = task.getStatus();

        // Kiểm tra Maker-Checker: Chuyển sang DONE hoặc CANCELLED bắt buộc có PERM_TASK_ASSIGN hoặc cấp quản lý / Trưởng phân khu
        if ("DONE".equals(targetStatus) || "CANCELLED".equals(targetStatus)) {
            boolean isZoneManager = farmSecurity != null && farmSecurity.isZoneManager(task.getFarmId());
            boolean canApprove = currentUser != null && (
                    currentUser.isSuperAdmin()
                    || currentUser.hasPermission("PERM_TASK_ASSIGN")
                    || currentUser.hasRole("ROLE_FARM_MANAGER")
                    || currentUser.hasRole("ROLE_TECHNICAL_STAFF")
                    || currentUser.hasRole("ROLE_WAREHOUSE_STAFF")
                    || isZoneManager
            );
            if (!canApprove) {
                throw new AccessDeniedException("Chỉ Quản lý trang trại, Trưởng phân khu hoặc Kỹ thuật viên (PERM_TASK_ASSIGN) mới có quyền nghiệm thu hoàn thành (DONE) hoặc hủy (CANCELLED) nhiệm vụ");
            }
        }

        task.setStatus(targetStatus);
        if (request.getCompletionNotes() != null) {
            task.setCompletionNotes(request.getCompletionNotes());
        }
        if (request.getPhotosJson() != null) {
            task.setPhotosJson(request.getPhotosJson());
        }
        if (request.getActualQuantity() != null) {
            task.setActualQuantity(request.getActualQuantity());
        }
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(currentUserId);

        task = farmTaskRepository.save(task);
        log.info("Updated task id={} status from {} to {}", task.getId(), oldStatus, task.getStatus());

        if ("IN_PROGRESS".equalsIgnoreCase(targetStatus)) {
            try {
                autoTransitionCropSeasonOnTaskProgress(task, "IN_PROGRESS", currentUserId);
            } catch (Exception ex) {
                log.warn("Failed auto transitioning crop season on task in-progress: {}", ex.getMessage());
            }

            if (inventoryService != null && task.getMaterialId() != null && task.getStandardQuantity() != null && task.getStandardQuantity().compareTo(java.math.BigDecimal.ZERO) > 0) {
                try {
                    inventoryService.autoCreateIssueDraftForTask(task.getFarmId(), task.getId(), currentUserId);
                } catch (Exception ex) {
                    log.warn("Failed auto dispatching warehouse issue for task id={}: {}", task.getId(), ex.getMessage());
                }
            }
        }

        if ("CANCELLED".equalsIgnoreCase(targetStatus) && inventoryService != null) {
            try {
                inventoryService.cancelIssueForTask(task.getFarmId(), task.getId(), "Công việc đã bị hủy");
            } catch (Exception ex) {
                log.warn("Failed cancelling warehouse issue for task id={}: {}", task.getId(), ex.getMessage());
            }
        }

        // Bắn Notification tới người giao việc (assignedByUserId) và Giám đốc trang trại (farm.getManagerUserId())
        if ("PENDING_REVIEW".equalsIgnoreCase(targetStatus) && notificationService != null) {
            try {
                String notifTitle = "Công việc hoàn thành chờ nghiệm thu";
                String notifMsg = String.format("Công việc [%s] đã được hoàn thành tại hiện trường và đang chờ nghiệm thu.", task.getTaskTitle());
                java.util.Set<Long> recipientUserIds = new java.util.HashSet<>();
                if (task.getAssignedByUserId() != null && !task.getAssignedByUserId().equals(currentUserId)) {
                    recipientUserIds.add(task.getAssignedByUserId());
                }
                farmRepository.findById(task.getFarmId()).ifPresent(farm -> {
                    java.util.Set<Long> mIds = resolveFarmManagerUserIds(farm);
                    for (Long mId : mIds) {
                        if (!mId.equals(currentUserId)) {
                            recipientUserIds.add(mId);
                        }
                    }
                });
                for (Long recipientId : recipientUserIds) {
                    notificationService.sendNotification(
                            task.getTenantId(),
                            recipientId,
                            notifTitle,
                            notifMsg,
                            "TASK",
                            "FARM_TASK",
                            task.getId(),
                            "/app/my-dashboard"
                    );
                }
            } catch (Exception ex) {
                log.warn("Failed to send task review notification: {}", ex.getMessage());
            }
        }

        // Bắn Notification khi Nghiệm thu hoàn thành (DONE) tới công nhân thực hiện
        if ("DONE".equalsIgnoreCase(targetStatus)) {
            // Tự động chuyển trạng thái Vụ Mùa sang GROWING khi nghiệm thu xong công việc PLANTING
            try {
                autoTransitionCropSeasonOnTaskProgress(task, "DONE", currentUserId);
            } catch (Exception ex) {
                log.warn("Failed auto transitioning crop season on task done: {}", ex.getMessage());
            }

            // Quy trình 1: Feed Auto-Backflushing (Xuất kho thức ăn & hạch toán chi phí khi việc cho ăn FEEDING hoàn thành)
            try {
                autoBackflushFeedingSuppliesAndExpense(task, currentUserId);
                task = farmTaskRepository.findById(task.getId()).orElse(task);
            } catch (Exception ex) {
                log.error("Lỗi khi tự động xuất kho thức ăn cho task id={}: {}", task.getId(), ex.getMessage(), ex);
            }

            // Quy trình 2: Configured Material Auto-Backflushing (Xuất kho vật tư cấu hình theo định mức khi hoàn thành)
            try {
                autoBackflushConfiguredMaterialsAndExpense(task, currentUserId, request.getActualQuantity());
                task = farmTaskRepository.findById(task.getId()).orElse(task);
            } catch (Exception ex) {
                log.error("Lỗi khi tự động xuất kho vật tư cấu hình cho task id={}: {}", task.getId(), ex.getMessage(), ex);
            }

            if (notificationService != null) {
                try {
                    String notifTitle = "Nhiệm vụ đã được nghiệm thu hoàn thành: " + task.getTaskTitle();
                    String notifMsg = "Nhiệm vụ [" + task.getTaskTitle() + "] của bạn đã được nghiệm thu ĐẠT (DONE).";
                    Set<Long> workerUserIds = resolveTaskWorkerUserIds(task);
                    for (Long wId : workerUserIds) {
                        if (!wId.equals(currentUserId)) {
                            notificationService.sendNotification(
                                    task.getTenantId(),
                                    wId,
                                    notifTitle,
                                    notifMsg,
                                    "TASK",
                                    "FARM_TASK",
                                    task.getId(),
                                    "/app/my-dashboard"
                            );
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to send task DONE notification: {}", ex.getMessage());
                }
            }
        }

        // Bắn Notification khi trả về yêu cầu làm lại (PENDING_REVIEW -> IN_PROGRESS)
        if ("PENDING_REVIEW".equalsIgnoreCase(oldStatus) && "IN_PROGRESS".equalsIgnoreCase(targetStatus) && notificationService != null) {
            try {
                String notifTitle = "Yêu cầu thực hiện lại công việc: " + task.getTaskTitle();
                String notifMsg = "Nhiệm vụ [" + task.getTaskTitle() + "] cần thực hiện lại. Ghi chú kiểm tra: " + (request.getCompletionNotes() != null ? request.getCompletionNotes() : "Vui lòng kiểm tra lại hiện trường.");
                Set<Long> workerUserIds = resolveTaskWorkerUserIds(task);
                for (Long wId : workerUserIds) {
                    if (!wId.equals(currentUserId)) {
                        notificationService.sendNotification(
                                task.getTenantId(),
                                wId,
                                notifTitle,
                                notifMsg,
                                "WARNING",
                                "FARM_TASK",
                                task.getId(),
                                "/app/my-dashboard"
                        );
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to send task redo notification: {}", ex.getMessage());
            }
        }

        return enrichTaskResponse(task);
    }

    private Set<Long> resolveTaskWorkerUserIds(FarmTask task) {
        Set<Long> workerUserIds = new HashSet<>();
        if (task.getAssignedToEmployeeId() != null) {
            employeeRepository.findById(task.getAssignedToEmployeeId())
                    .map(Employee::getUserId)
                    .filter(Objects::nonNull)
                    .ifPresent(workerUserIds::add);
        }
        List<FarmTaskAssignee> assignees = farmTaskAssigneeRepository.findByTaskId(task.getId());
        for (FarmTaskAssignee a : assignees) {
            if (a.getEmployeeId() != null) {
                employeeRepository.findById(a.getEmployeeId())
                        .map(Employee::getUserId)
                        .filter(Objects::nonNull)
                        .ifPresent(workerUserIds::add);
            }
        }
        return workerUserIds;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmTaskDetailResponse> getTasks(Long farmId, Pageable pageable) {
        return getTasks(farmId, null, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmTaskDetailResponse> getTasks(Long farmId, String taskType, String status, Boolean isRoutine, Long zoneId, Long employeeId, String search, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Xác định cấp độ phân quyền xem công việc
        boolean isSuperAdmin = currentUser != null && (currentUser.isSuperAdmin() || currentUser.hasRole("ROLE_SUPER_ADMIN"));
        boolean isFarmOwner = currentUser != null && currentUser.hasRole("ROLE_FARM_OWNER");
        boolean isFarmManager = currentUser != null && (currentUser.hasRole("ROLE_FARM_MANAGER") || (farmSecurity != null && farmSecurity.isFarmManager(farmId)));
        boolean isAccountant = currentUser != null && currentUser.hasRole("ROLE_ACCOUNTANT");
        boolean hasFarmWideTaskAccess = isSuperAdmin || isFarmOwner || isFarmManager || isAccountant;

        // 2. Kiểm tra xem người dùng có phải là Tổ trưởng phân khu (Zone Manager / Tech Lead) không
        boolean isZoneLeader = farmSecurity != null && farmSecurity.isZoneManager(farmId);
        Set<Long> managedZoneIds = farmSecurity != null ? farmSecurity.getManagedZoneIds(farmId) : Collections.emptySet();

        // 3. Tìm thông tin nhân sự (Employee) của user đang đăng nhập
        Optional<Employee> currentEmpOpt = currentUserId != null
                ? employeeRepository.findByTenantIdAndUserId(tenantId, currentUserId).or(() -> employeeRepository.findByUserId(currentUserId))
                : Optional.empty();
        Long currentEmpId = currentEmpOpt.map(Employee::getId).orElse(null);

        List<Long> myDirectTaskIds = null;
        if (currentEmpId != null) {
            myDirectTaskIds = farmTaskAssigneeRepository.findByEmployeeId(currentEmpId)
                    .stream()
                    .map(FarmTaskAssignee::getTaskId)
                    .collect(Collectors.toList());
        }
        final List<Long> finalMyDirectTaskIds = myDirectTaskIds;

        List<Long> assigneeTaskIds = null;
        if (employeeId != null) {
            assigneeTaskIds = farmTaskAssigneeRepository.findByEmployeeId(employeeId)
                    .stream()
                    .map(FarmTaskAssignee::getTaskId)
                    .collect(Collectors.toList());
        }

        final List<Long> finalAssigneeTaskIds = assigneeTaskIds;

        Specification<FarmTask> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("farmId"), farmId));
            if (tenantId != null) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }

            // --- KIỂM SOÁT PHẠM VI XEM CÔNG VIỆC THEO NGUYÊN TẮC: VIỆC CỦA AI NGƯỜI ĐÓ THẤY ---
            if (!hasFarmWideTaskAccess) {
                if (isZoneLeader || !managedZoneIds.isEmpty()) {
                    // Tổ trưởng phân khu:
                    // - Thấy các việc thuộc phân khu mình phụ trách (bao gồm việc của nhân sự không có tài khoản trong khu)
                    // - Thấy các việc do chính mình giao (assignedByUserId)
                    // - Thấy các việc giao trực tiếp cho mình
                    List<Predicate> zoneLeaderPredicates = new ArrayList<>();
                    if (!managedZoneIds.isEmpty()) {
                        zoneLeaderPredicates.add(root.get("zoneId").in(managedZoneIds));
                    }
                    if (currentUserId != null) {
                        zoneLeaderPredicates.add(cb.equal(root.get("assignedByUserId"), currentUserId));
                    }
                    if (currentEmpId != null) {
                        Predicate assignedDirect = cb.equal(root.get("assignedToEmployeeId"), currentEmpId);
                        if (finalMyDirectTaskIds != null && !finalMyDirectTaskIds.isEmpty()) {
                            zoneLeaderPredicates.add(cb.or(assignedDirect, root.get("id").in(finalMyDirectTaskIds)));
                        } else {
                            zoneLeaderPredicates.add(assignedDirect);
                        }
                    }
                    predicates.add(cb.or(zoneLeaderPredicates.toArray(new Predicate[0])));
                } else if (currentEmpId != null) {
                    // Nhân sự / Công nhân thông thường có tài khoản (Role 6A / Field Staff):
                    // Việc của ai người đó thấy: Chỉ thấy việc giao cho chính mình
                    Predicate assignedDirect = cb.equal(root.get("assignedToEmployeeId"), currentEmpId);
                    if (finalMyDirectTaskIds != null && !finalMyDirectTaskIds.isEmpty()) {
                        predicates.add(cb.or(assignedDirect, root.get("id").in(finalMyDirectTaskIds)));
                    } else {
                        predicates.add(assignedDirect);
                    }
                } else {
                    // Tài khoản không có hồ sơ nhân sự và không có quyền quản lý -> không thấy công việc của người khác
                    predicates.add(cb.disjunction());
                }
            }

            if (StringUtils.hasText(taskType)) {
                predicates.add(cb.equal(root.get("taskType"), taskType));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (zoneId != null) {
                predicates.add(cb.equal(root.get("zoneId"), zoneId));
            }
            if (isRoutine != null) {
                if (isRoutine) {
                    predicates.add(cb.like(root.get("taskTitle"), "[CỐ ĐỊNH HÀNG NGÀY]%"));
                } else {
                    predicates.add(cb.notLike(root.get("taskTitle"), "[CỐ ĐỊNH HÀNG NGÀY]%"));
                }
            }
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("taskTitle")), pattern),
                        cb.like(cb.lower(root.get("completionNotes")), pattern)
                ));
            }
            if (employeeId != null) {
                Predicate assignedToDirect = cb.equal(root.get("assignedToEmployeeId"), employeeId);
                if (finalAssigneeTaskIds != null && !finalAssigneeTaskIds.isEmpty()) {
                    predicates.add(cb.or(assignedToDirect, root.get("id").in(finalAssigneeTaskIds)));
                } else {
                    predicates.add(assignedToDirect);
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return farmTaskRepository.findAll(spec, pageable).map(this::enrichTaskResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmTaskDetailResponse getTaskById(Long id) {
        FarmTask task = farmTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FarmTask", "id", id));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUser != null && !currentUser.isSuperAdmin() && !currentUser.hasRole("ROLE_SUPER_ADMIN")
                && !currentUser.hasRole("ROLE_FARM_OWNER") && !currentUser.hasRole("ROLE_FARM_MANAGER")
                && !(farmSecurity != null && farmSecurity.isFarmManager(task.getFarmId()))
                && !currentUser.hasRole("ROLE_ACCOUNTANT")) {

            boolean isZoneLeader = farmSecurity != null && farmSecurity.isZoneManager(task.getFarmId());
            Set<Long> managedZoneIds = farmSecurity != null ? farmSecurity.getManagedZoneIds(task.getFarmId()) : Collections.emptySet();
            boolean isTaskInManagedZone = task.getZoneId() != null && managedZoneIds.contains(task.getZoneId());
            boolean isAssignedByMe = task.getAssignedByUserId() != null && task.getAssignedByUserId().equals(currentUserId);

            Long currentEmpId = employeeRepository.findByTenantIdAndUserId(task.getTenantId(), currentUserId)
                    .or(() -> employeeRepository.findByUserId(currentUserId))
                    .map(Employee::getId)
                    .orElse(null);
            boolean isAssignedToMe = currentEmpId != null && (
                    Objects.equals(task.getAssignedToEmployeeId(), currentEmpId)
                    || farmTaskAssigneeRepository.findByTaskId(task.getId()).stream().anyMatch(a -> Objects.equals(a.getEmployeeId(), currentEmpId))
            );

            if (!isZoneLeader && !isTaskInManagedZone && !isAssignedByMe && !isAssignedToMe) {
                throw new AccessDeniedException("Bạn không có quyền xem chi tiết công việc này (việc của ai người đó thấy).");
            }
        }

        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public List<FarmTaskDetailResponse> generateDailyRoutines(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Farm farm = farmRepository.findById(farmId)
                .filter(f -> tenantId == null || f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        // 1. Tìm tất cả các task cố định hàng ngày của farm
        List<FarmTask> allTasks = farmTaskRepository.findByFarmIdOrderByCreatedAtDesc(farmId);
        List<FarmTask> routineTasks = allTasks.stream()
                .filter(t -> t.getTaskTitle() != null && t.getTaskTitle().startsWith("[CỐ ĐỊNH HÀNG NGÀY]"))
                .collect(Collectors.toList());

        // 2. Gom nhóm theo chữ ký công việc: taskTitle + "|" + (zoneId != null ? zoneId : "0")
        Map<String, List<FarmTask>> routineGroups = new LinkedHashMap<>();
        for (FarmTask task : routineTasks) {
            String signature = task.getTaskTitle().trim() + "|" + (task.getZoneId() != null ? task.getZoneId() : "0");
            routineGroups.computeIfAbsent(signature, k -> new ArrayList<>()).add(task);
        }

        LocalDate today = LocalDate.now();
        Instant startOfToday = today.atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<FarmTaskDetailResponse> results = new ArrayList<>();

        for (Map.Entry<String, List<FarmTask>> entry : routineGroups.entrySet()) {
            List<FarmTask> group = entry.getValue();
            // Lấy task mới nhất theo createdAt
            FarmTask latest = group.get(0);

            // Nếu task mới nhất đã bị CANCELLED, xem như đầu việc này đã bị ngừng -> bỏ qua
            if ("CANCELLED".equalsIgnoreCase(latest.getStatus())) {
                continue;
            }

            // 3. Kiểm tra tần suất lặp lại (Recurrence)
            String recDays = latest.getRecurrenceDays();
            if (recDays != null && !recDays.isBlank() && !"ALL".equalsIgnoreCase(recDays.trim())) {
                String dayOfWeek = today.getDayOfWeek().name().substring(0, 3); // MON, TUE, WED...
                String vnDay = switch (dayOfWeek) {
                    case "MON" -> "T2";
                    case "TUE" -> "T3";
                    case "WED" -> "T4";
                    case "THU" -> "T5";
                    case "FRI" -> "T6";
                    case "SAT" -> "T7";
                    case "SUN" -> "CN";
                    default -> "";
                };
                boolean matches = recDays.toUpperCase().contains(dayOfWeek)
                        || (!vnDay.isEmpty() && recDays.toUpperCase().contains(vnDay));
                if (!matches) {
                    log.info("Bỏ qua sinh việc cố định id={} [{}] vì hôm nay ({}/{}) không nằm trong cấu hình lặp lại [{}]",
                            latest.getId(), latest.getTaskTitle(), dayOfWeek, vnDay, recDays);
                    continue;
                }
            }

            // Kiểm tra xem hôm nay đã có instance của routine này chưa
            Optional<FarmTask> todayTask = group.stream()
                    .filter(t -> !"CANCELLED".equalsIgnoreCase(t.getStatus()))
                    .filter(t -> (t.getCreatedAt() != null && t.getCreatedAt().isAfter(startOfToday)) ||
                                 (t.getDeadline() != null && t.getDeadline().isAfter(startOfToday)))
                    .findFirst();

            if (todayTask.isPresent()) {
                // Đã có việc cho ngày hôm nay, giữ nguyên
                results.add(enrichTaskResponse(todayTask.get()));
            } else {
                // Tính deadline theo khung giờ cụ thể hoặc theo ca làm việc (nếu có)
                Instant taskDeadline = today.atTime(18, 0).atZone(ZoneId.systemDefault()).toInstant();
                if (latest.getEndTime() != null) {
                    taskDeadline = today.atTime(latest.getEndTime()).atZone(ZoneId.systemDefault()).toInstant();
                } else if (latest.getShiftId() != null && workShiftRepository != null) {
                    var wsOpt = workShiftRepository.findById(latest.getShiftId());
                    if (wsOpt.isPresent() && wsOpt.get().getEndTime() != null) {
                        var ws = wsOpt.get();
                        if (ws.getIsOvernight() != null && ws.getIsOvernight()) {
                            taskDeadline = today.plusDays(1).atTime(ws.getEndTime()).atZone(ZoneId.systemDefault()).toInstant();
                        } else {
                            taskDeadline = today.atTime(ws.getEndTime()).atZone(ZoneId.systemDefault()).toInstant();
                        }
                    }
                }

                // Chưa có việc cho hôm nay -> Sinh nhiệm vụ mới cho ngày hôm nay
                FarmTask newTask = FarmTask.builder()
                        .tenantId(farm.getTenantId())
                        .farmId(farm.getId())
                        .zoneId(latest.getZoneId())
                        .locationId(latest.getLocationId())
                        .taskTitle(latest.getTaskTitle())
                        .taskType(latest.getTaskType())
                        .priority(latest.getPriority())
                        .shiftId(latest.getShiftId())
                        .startTime(latest.getStartTime())
                        .endTime(latest.getEndTime())
                        .recurrenceDays(latest.getRecurrenceDays())
                        .assignmentMode(latest.getAssignmentMode())
                        .warehouseId(latest.getWarehouseId())
                        .materialId(latest.getMaterialId())
                        .standardQuantity(latest.getStandardQuantity())
                        .cropSeasonId(latest.getCropSeasonId())
                        .livestockGroupId(latest.getLivestockGroupId())
                        .assignedToEmployeeId(latest.getAssignedToEmployeeId())
                        .assignedByUserId(currentUserId != null ? currentUserId : latest.getAssignedByUserId())
                        .deadline(taskDeadline)
                        .status("TODO")
                        .completionNotes("Tự động khởi tạo từ công việc cố định hàng ngày")
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                newTask = farmTaskRepository.save(newTask);

                // Phân công nhân sự: Ưu tiên lấy theo ca trực hôm nay nếu assignmentMode là DYNAMIC_BY_SHIFT
                List<Long> dynamicEmpIds = new ArrayList<>();
                if ("DYNAMIC_BY_SHIFT".equalsIgnoreCase(latest.getAssignmentMode())
                        && shiftAssignmentRepository != null) {
                    var shiftAssigns = shiftAssignmentRepository.findByFarmIdAndWorkDate(farm.getId(), today);

                    List<Long> timeMatchedEmpIds = new ArrayList<>();
                    List<Long> zoneAndTimeMatchedEmpIds = new ArrayList<>();

                    LocalTime taskStart = latest.getStartTime();
                    LocalTime taskEnd = latest.getEndTime();
                    Long targetZoneId = latest.getZoneId();

                    for (var sa : shiftAssigns) {
                        if ("CANCELLED".equalsIgnoreCase(sa.getStatus())) {
                            continue;
                        }

                        // Lấy thông tin ca làm việc của nhân sự
                        com.farm.saas.modules.masterdata.entity.WorkShift empShift = null;
                        if (workShiftRepository != null && sa.getShiftId() != null) {
                            empShift = workShiftRepository.findById(sa.getShiftId()).orElse(null);
                        }

                        boolean timeMatched = false;
                        if (taskStart != null && taskEnd != null) {
                            // CẢI TIẾN 1: Bắt buộc ca làm việc của nhân sự hôm đó phải bao trọn khung giờ của task!
                            if (empShift != null) {
                                timeMatched = isShiftCoveringTask(empShift, taskStart, taskEnd);
                            }
                        } else if (latest.getShiftId() != null) {
                            // Không có khung giờ cụ thể -> đối chiếu theo shiftId
                            timeMatched = sa.getShiftId().equals(latest.getShiftId());
                        } else {
                            // Không cấu hình giờ và ca -> tất cả nhân sự có đi làm trong ngày
                            timeMatched = true;
                        }

                        if (timeMatched) {
                            timeMatchedEmpIds.add(sa.getEmployeeId());

                            // Kiểm tra xem nhân sự có thuộc đúng phân khu của task không
                            if (targetZoneId != null) {
                                boolean inZone = false;
                                Employee emp = employeeRepository.findById(sa.getEmployeeId()).orElse(null);
                                if (emp != null && farmAssignmentRepository != null) {
                                    inZone = farmAssignmentRepository.findByFarmId(farm.getId())
                                            .stream()
                                            .anyMatch(fa -> Boolean.TRUE.equals(fa.getIsActive())
                                                    && targetZoneId.equals(fa.getZoneId())
                                                    && (emp.getUserId() != null && emp.getUserId().equals(fa.getUserId())));
                                }
                                if (inZone) {
                                    zoneAndTimeMatchedEmpIds.add(sa.getEmployeeId());
                                }
                            }
                        }
                    }

                    // Ưu tiên nhân sự vừa đúng khung giờ vừa thuộc đúng phân khu
                    if (!zoneAndTimeMatchedEmpIds.isEmpty()) {
                        dynamicEmpIds = zoneAndTimeMatchedEmpIds;
                    } else {
                        dynamicEmpIds = timeMatchedEmpIds;
                    }
                }

                if (!dynamicEmpIds.isEmpty()) {
                    Long leaderId = latest.getAssignedToEmployeeId();
                    if (leaderId != null && !dynamicEmpIds.contains(leaderId)) {
                        dynamicEmpIds.add(0, leaderId);
                    }
                    for (Long empId : dynamicEmpIds) {
                        boolean isLeader = empId.equals(leaderId);
                        FarmTaskAssignee newAssignee = FarmTaskAssignee.builder()
                                .taskId(newTask.getId())
                                .tenantId(farm.getTenantId())
                                .employeeId(empId)
                                .roleInTask(isLeader ? "LEADER" : "MEMBER")
                                .assignedAt(Instant.now())
                                .build();
                        farmTaskAssigneeRepository.save(newAssignee);
                    }
                    if (newTask.getAssignedToEmployeeId() == null) {
                        newTask.setAssignedToEmployeeId(dynamicEmpIds.get(0));
                        farmTaskRepository.save(newTask);
                    }
                } else {
                    // Sao chép danh sách assignees từ template
                    List<FarmTaskAssignee> templateAssignees = farmTaskAssigneeRepository.findByTaskId(latest.getId());
                    for (FarmTaskAssignee a : templateAssignees) {
                        FarmTaskAssignee newAssignee = FarmTaskAssignee.builder()
                                .taskId(newTask.getId())
                                .tenantId(farm.getTenantId())
                                .employeeId(a.getEmployeeId())
                                .roleInTask(a.getRoleInTask())
                                .assignedAt(Instant.now())
                                .build();
                        farmTaskAssigneeRepository.save(newAssignee);
                    }
                }

                log.info("Generated today routine task id={} title={} for farmId={}", newTask.getId(), newTask.getTaskTitle(), farmId);
                results.add(enrichTaskResponse(newTask));
            }
        }

        return results;
    }

    @Override
    @Transactional
    public int cancelPendingRoutineTasksForZone(Long farmId, Long zoneId, String reason) {
        if (farmId == null || zoneId == null) {
            return 0;
        }
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<FarmTask> tasks = farmTaskRepository.findByFarmId(farmId, Pageable.unpaged()).getContent();
        int cancelledCount = 0;
        String note = (reason != null && !reason.isBlank()) ? reason : "Tự động kết thúc do đã thu hoạch / xuất chuồng";

        for (FarmTask task : tasks) {
            if (zoneId.equals(task.getZoneId())
                    && "TODO".equalsIgnoreCase(task.getStatus())
                    && task.getTaskTitle() != null
                    && task.getTaskTitle().startsWith("[CỐ ĐỊNH HÀNG NGÀY]")) {
                if (tenantId != null && !tenantId.equals(task.getTenantId())) {
                    continue;
                }
                task.setStatus("CANCELLED");
                task.setCompletionNotes(note);
                task.setUpdatedAt(Instant.now());
                farmTaskRepository.save(task);
                cancelledCount++;
            }
        }

        log.info("Auto-cancelled {} routine tasks for farmId={}, zoneId={}", cancelledCount, farmId, zoneId);
        return cancelledCount;
    }

    /**
     * Tự động đồng bộ trạng thái Vụ Mùa (CropSeason) theo tiến độ của nhiệm vụ hiện trường:
     * - Khi công nhân bấm làm việc gieo trồng (PLANTING in-progress): SOIL_PREPARATION -> SOWING
     * - Khi nghiệm thu hoàn thành gieo trồng (PLANTING done): SOWING / SOIL_PREPARATION -> GROWING
     * - Khi công nhân bấm làm việc thu hoạch (HARVESTING in-progress): GROWING -> HARVESTING
     */
    private void autoTransitionCropSeasonOnTaskProgress(FarmTask task, String taskStatus, Long currentUserId) {
        if (cropSeasonRepository == null || task == null || task.getZoneId() == null) {
            return;
        }
        try {
            Long farmId = task.getFarmId();
            Long zoneId = task.getZoneId();
            String taskType = task.getTaskType();

            var seasons = cropSeasonRepository.findAll((root, query, cb) -> cb.and(
                    cb.equal(root.get("farmId"), farmId),
                    cb.equal(root.get("zoneId"), zoneId),
                    cb.not(root.get("status").in("CLOSED", "CANCELLED"))
            ));

            for (com.farm.saas.modules.crop.entity.CropSeason season : seasons) {
                boolean changed = false;
                if ("PLANTING".equalsIgnoreCase(taskType)) {
                    if ("IN_PROGRESS".equalsIgnoreCase(taskStatus)) {
                        if ("SOIL_PREPARATION".equalsIgnoreCase(season.getStatus())) {
                            season.setStatus("SOWING");
                            changed = true;
                            log.info("Auto-transitioned crop season id={} ({}) from SOIL_PREPARATION to SOWING by task id={}",
                                    season.getId(), season.getSeasonCode(), task.getId());
                        }
                    } else if ("DONE".equalsIgnoreCase(taskStatus)) {
                        if ("SOWING".equalsIgnoreCase(season.getStatus()) || "SOIL_PREPARATION".equalsIgnoreCase(season.getStatus())) {
                            season.setStatus("GROWING");
                            changed = true;
                            log.info("Auto-transitioned crop season id={} ({}) to GROWING by task done id={}",
                                    season.getId(), season.getSeasonCode(), task.getId());
                        }
                    }
                } else if ("HARVESTING".equalsIgnoreCase(taskType)) {
                    if ("IN_PROGRESS".equalsIgnoreCase(taskStatus)) {
                        if ("GROWING".equalsIgnoreCase(season.getStatus())) {
                            season.setStatus("HARVESTING");
                            changed = true;
                            log.info("Auto-transitioned crop season id={} ({}) from GROWING to HARVESTING by task id={}",
                                    season.getId(), season.getSeasonCode(), task.getId());
                        }
                    }
                }

                if (changed) {
                    season.setUpdatedAt(Instant.now());
                    season.setUpdatedBy(currentUserId);
                    cropSeasonRepository.save(season);
                }
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi tự động đồng bộ trạng thái mùa vụ từ nhiệm vụ id={}: {}", task.getId(), ex.getMessage());
        }
    }

    /**
     * Quy trình 1: Feed Auto-Backflushing
     * Khi hoàn thành nhiệm vụ cho ăn (FEEDING), tự động xuất kho cám/thức ăn theo FEFO
     * và hạch toán chi phí thức ăn vào đàn nuôi (FarmExpense) cho kế toán.
     */
    private void autoBackflushFeedingSuppliesAndExpense(FarmTask task, Long currentUserId) {
        if (livestockGroupRepository == null || warehouseRepository == null || warehouseInventoryRepository == null
                || warehouseIssueRepository == null || warehouseIssueItemRepository == null
                || farmExpenseRepository == null || costCategoryRepository == null) {
            return;
        }

        String tType = task.getTaskType() != null ? task.getTaskType().toUpperCase() : "";
        String tTitle = task.getTaskTitle() != null ? task.getTaskTitle().toUpperCase() : "";
        boolean isFeeding = "FEEDING".equals(tType) || tTitle.contains("FEEDING") || tTitle.contains("CHO ĂN");
        if (!isFeeding) {
            return;
        }

        String notes = task.getCompletionNotes() != null ? task.getCompletionNotes() : "";
        if (notes.contains("[ĐÃ XUẤT KHO THỨC ĂN") || notes.contains("[FEED_BACKFLUSHED]")) {
            return;
        }

        Long farmId = task.getFarmId();
        Long zoneId = task.getZoneId();
        if (farmId == null) {
            return;
        }

        // 1. Tìm đàn vật nuôi đang hoạt động tại chuồng / phân khu này
        List<com.farm.saas.modules.livestock.entity.LivestockGroup> activeGroups;
        if (zoneId != null) {
            activeGroups = livestockGroupRepository.findAll((root, query, cb) -> cb.and(
                    cb.equal(root.get("farmId"), farmId),
                    cb.equal(root.get("zoneId"), zoneId),
                    cb.not(root.get("status").in("SOLD", "CLOSED", "CULLED"))
            ));
        } else {
            activeGroups = livestockGroupRepository.findAll((root, query, cb) -> cb.and(
                    cb.equal(root.get("farmId"), farmId),
                    cb.not(root.get("status").in("SOLD", "CLOSED", "CULLED"))
            ));
        }

        if (activeGroups.isEmpty()) {
            log.info("Không tìm thấy đàn vật nuôi đang nuôi tại phân khu id={} để xuất kho thức ăn", zoneId);
            return;
        }

        com.farm.saas.modules.livestock.entity.LivestockGroup group = activeGroups.get(0);
        int headCount = (group.getCurrentQuantity() != null && group.getCurrentQuantity() > 0) ? group.getCurrentQuantity() : 1;

        // Định mức thức ăn: 2.0 kg/con/ngày (hoặc tối thiểu 20 kg)
        java.math.BigDecimal feedQtyToDeduct = java.math.BigDecimal.valueOf(headCount).multiply(new java.math.BigDecimal("2.0")).setScale(2, java.math.RoundingMode.HALF_UP);
        if (feedQtyToDeduct.compareTo(new java.math.BigDecimal("10.0")) < 0) {
            feedQtyToDeduct = new java.math.BigDecimal("20.00");
        }

        // 2. Tìm Kho thức ăn chăn nuôi (ANIMAL_FEED hoặc VETERINARY hoặc kho hoạt động)
        var warehouses = warehouseRepository.findByFarmId(farmId);
        com.farm.saas.modules.masterdata.entity.Warehouse targetWh = warehouses.stream()
                .filter(w -> "ANIMAL_FEED".equalsIgnoreCase(w.getWarehouseType()) || "VETERINARY".equalsIgnoreCase(w.getWarehouseType()))
                .filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus()))
                .findFirst()
                .orElse(null);

        if (targetWh == null && !warehouses.isEmpty()) {
            targetWh = warehouses.stream().filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus())).findFirst().orElse(null);
        }

        if (targetWh == null) {
            log.warn("Không tìm thấy kho thức ăn hoạt động tại farmId={}", farmId);
            return;
        }

        // 3. Tìm tồn kho thức ăn / cám trong kho
        var inventories = warehouseInventoryRepository.findByWarehouseId(targetWh.getId());
        com.farm.saas.modules.inventory.entity.WarehouseInventory feedInv = null;
        for (var inv : inventories) {
            if (inv.getQuantityOnHand() != null && inv.getQuantityOnHand().compareTo(java.math.BigDecimal.ZERO) > 0) {
                var mat = materialRepository != null ? materialRepository.findById(inv.getMaterialId()).orElse(null) : null;
                if (mat != null && (
                        (mat.getName() != null && mat.getName().toUpperCase().contains("CÁM")) ||
                        (mat.getName() != null && mat.getName().toUpperCase().contains("THỨC ĂN")) ||
                        (mat.getSkuCode() != null && mat.getSkuCode().toUpperCase().contains("FEED")))) {
                    feedInv = inv;
                    break;
                }
            }
        }

        if (feedInv == null) {
            feedInv = inventories.stream()
                    .filter(i -> i.getQuantityOnHand() != null && i.getQuantityOnHand().compareTo(java.math.BigDecimal.ZERO) > 0)
                    .findFirst()
                    .orElse(null);
        }

        if (feedInv == null) {
            log.warn("Kho id={} không còn tồn kho thức ăn để tự động backflush cho đàn {}", targetWh.getId(), group.getGroupCode());
            task.setCompletionNotes(notes + (notes.isBlank() ? "" : " | ") + "[CẢNH BÁO: Kho không đủ tồn kho thức ăn để tự động xuất]");
            farmTaskRepository.save(task);
            return;
        }

        // 4. Trừ kho theo số lượng khả dụng
        java.math.BigDecimal available = feedInv.getQuantityOnHand().subtract(feedInv.getReservedQuantity() != null ? feedInv.getReservedQuantity() : java.math.BigDecimal.ZERO);
        java.math.BigDecimal actualDeduct = feedQtyToDeduct.min(available);
        if (actualDeduct.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            actualDeduct = feedInv.getQuantityOnHand();
        }

        java.math.BigDecimal unitPrice = (feedInv.getUnitCost() != null && feedInv.getUnitCost().compareTo(java.math.BigDecimal.ZERO) > 0)
                ? feedInv.getUnitCost()
                : new java.math.BigDecimal("22000.00");
        java.math.BigDecimal totalAmount = actualDeduct.multiply(unitPrice).setScale(2, java.math.RoundingMode.HALF_UP);

        feedInv.setQuantityOnHand(feedInv.getQuantityOnHand().subtract(actualDeduct));
        feedInv.setUpdatedAt(Instant.now());
        warehouseInventoryRepository.save(feedInv);

        String batchNum = feedInv.getBatchNumber() != null ? feedInv.getBatchNumber() : "DEFAULT";

        // 1. Tạo phiếu xuất WarehouseIssue trước để lấy ID
        String issueCode = "ISS-FEED-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        com.farm.saas.modules.inventory.entity.WarehouseIssue issue = com.farm.saas.modules.inventory.entity.WarehouseIssue.builder()
                .tenantId(task.getTenantId())
                .farmId(farmId)
                .warehouseId(targetWh.getId())
                .issueCode(issueCode)
                .issueType("PRODUCTION_BACKFLUSH")
                .isBackflushed(true)
                .livestockGroupId(group.getId())
                .receiverName("Công nhân hiện trường")
                .issueDate(LocalDate.now())
                .totalAmount(totalAmount)
                .status("COMPLETED")
                .approvedBy(currentUserId)
                .approvedAt(Instant.now())
                .notes("Tự động xuất kho " + actualDeduct + " kg cám cho đàn " + group.getGroupCode() + " khi hoàn thành công việc: " + task.getTaskTitle())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        issue = warehouseIssueRepository.save(issue);

        // 2. Tạo WarehouseIssueItem để lấy ID
        com.farm.saas.modules.inventory.entity.WarehouseIssueItem issueItem = com.farm.saas.modules.inventory.entity.WarehouseIssueItem.builder()
                .issueId(issue.getId())
                .tenantId(task.getTenantId())
                .materialId(feedInv.getMaterialId())
                .batchNumber(batchNum)
                .enteredUnit("KG")
                .enteredQuantity(actualDeduct)
                .conversionFactor(java.math.BigDecimal.ONE)
                .quantity(actualDeduct)
                .unitPrice(unitPrice)
                .totalPrice(totalAmount)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        issueItem = warehouseIssueItemRepository.save(issueItem);

        // 3. Ghi nhận giao dịch kho WarehouseInventoryTransaction với đầy đủ các trường NOT NULL bắt buộc
        if (warehouseInventoryTransactionRepository != null) {
            com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction trans = com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction.builder()
                    .tenantId(task.getTenantId())
                    .farmId(farmId)
                    .warehouseId(targetWh.getId())
                    .materialId(feedInv.getMaterialId())
                    .batchNumber(batchNum)
                    .transactionType("ISSUE")
                    .referenceDocType("WAREHOUSE_ISSUE")
                    .referenceDocId(issue.getId())
                    .referenceItemId(issueItem.getId())
                    .direction("OUT")
                    .quantity(actualDeduct)
                    .unitPrice(unitPrice)
                    .totalAmount(totalAmount)
                    .balanceBefore(feedInv.getQuantityOnHand().add(actualDeduct))
                    .balanceAfter(feedInv.getQuantityOnHand())
                    .transactionDate(LocalDate.now())
                    .notes("Tự động xuất kho thức ăn (Backflush) khi hoàn thành việc #" + task.getId())
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            warehouseInventoryTransactionRepository.save(trans);
        }

        // 4. Ghi nhận chi phí đàn nuôi FarmExpense
        var costCats = costCategoryRepository.findByTenantIdAndCostType(task.getTenantId(), "MATERIALS");
        var feedCategory = costCats.stream()
                .filter(c -> "CC_FEED".equalsIgnoreCase(c.getCode()) || "FEED".equalsIgnoreCase(c.getCode()))
                .findFirst()
                .orElse(costCats.isEmpty() ? null : costCats.get(0));

        if (feedCategory != null) {
            String expenseCode = "EXP-FEED-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            com.farm.saas.modules.finance.entity.FarmExpense expense = com.farm.saas.modules.finance.entity.FarmExpense.builder()
                    .tenantId(task.getTenantId())
                    .farmId(farmId)
                    .livestockGroupId(group.getId())
                    .costCategoryId(feedCategory.getId())
                    .expenseCode(expenseCode)
                    .expenseSource("INTERNAL")
                    .referenceId(issue.getId())
                    .expenseDate(LocalDate.now())
                    .amount(totalAmount)
                    .unitCostEligible(true)
                    .paymentMethod("INTERNAL_ALLOCATION")
                    .status("CONFIRMED")
                    .notes("Tự động hạch toán chi phí thức ăn đàn " + group.getGroupCode() + " (" + actualDeduct + " kg) theo phiếu xuất " + issueCode)
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            farmExpenseRepository.save(expense);
        }

        // Cập nhật CompletionNotes của task
        String backflushNote = "[ĐÃ XUẤT KHO THỨC ĂN: " + actualDeduct + " kg (Mã xuất: " + issueCode + ", Chi phí: " + String.format("%,.0f", totalAmount) + " đ)]";
        task.setCompletionNotes(notes + (notes.isBlank() ? "" : " | ") + backflushNote);
        farmTaskRepository.save(task);

        log.info("Auto-backflushed feeding supplies: {} kg, cost={}, issue={}, expense for group={}",
                actualDeduct, totalAmount, issueCode, group.getGroupCode());
    }

    /**
     * Quy trình 2: Configured Material Auto-Backflushing
     * Xuất kho vật tư theo định mức cấu hình và hạch toán chi phí vào Vụ Mùa hoặc Đàn Nuôi
     */
    private void autoBackflushConfiguredMaterialsAndExpense(FarmTask task, Long currentUserId, java.math.BigDecimal submittedActualQty) {
        if (task.getMaterialId() == null || task.getWarehouseId() == null
                || warehouseRepository == null || warehouseInventoryRepository == null
                || warehouseIssueRepository == null || warehouseIssueItemRepository == null
                || farmExpenseRepository == null || costCategoryRepository == null) {
            return;
        }

        String notes = task.getCompletionNotes() != null ? task.getCompletionNotes() : "";
        if (notes.contains("[ĐÃ XUẤT KHO VẬT TƯ") || notes.contains("[MATERIAL_BACKFLUSHED]")) {
            return;
        }

        Long farmId = task.getFarmId();
        Long warehouseId = task.getWarehouseId();
        Long materialId = task.getMaterialId();

        var mat = materialRepository != null ? materialRepository.findById(materialId).orElse(null) : null;
        String matName = mat != null ? mat.getName() : "Vật tư #" + materialId;
        String matUnit = (mat != null && mat.getStandardUnit() != null) ? mat.getStandardUnit() : "Đơn vị";

        // Xác định số lượng xuất: ưu tiên actualQuantity gửi kèm từ báo cáo hoàn thành, nếu không lấy standardQuantity
        java.math.BigDecimal qtyToDeduct = (submittedActualQty != null && submittedActualQty.compareTo(java.math.BigDecimal.ZERO) > 0)
                ? submittedActualQty
                : (task.getStandardQuantity() != null && task.getStandardQuantity().compareTo(java.math.BigDecimal.ZERO) > 0
                    ? task.getStandardQuantity()
                    : java.math.BigDecimal.ONE);

        var inventories = warehouseInventoryRepository.findByWarehouseId(warehouseId);
        com.farm.saas.modules.inventory.entity.WarehouseInventory targetInv = null;
        for (var inv : inventories) {
            if (materialId.equals(inv.getMaterialId()) && inv.getQuantityOnHand() != null && inv.getQuantityOnHand().compareTo(java.math.BigDecimal.ZERO) > 0) {
                targetInv = inv;
                break;
            }
        }

        if (targetInv == null) {
            log.warn("Kho id={} không còn tồn kho cho vật tư {} để tự động xuất", warehouseId, matName);
            task.setCompletionNotes(notes + (notes.isBlank() ? "" : " | ") + "[CẢNH BÁO: Kho không đủ tồn kho " + matName + " để tự động xuất]");
            task.setActualQuantity(qtyToDeduct);
            farmTaskRepository.save(task);
            return;
        }

        java.math.BigDecimal available = targetInv.getQuantityOnHand().subtract(targetInv.getReservedQuantity() != null ? targetInv.getReservedQuantity() : java.math.BigDecimal.ZERO);
        java.math.BigDecimal actualDeduct = qtyToDeduct.min(available);
        if (actualDeduct.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            actualDeduct = targetInv.getQuantityOnHand();
        }

        java.math.BigDecimal unitPrice = (targetInv.getUnitCost() != null && targetInv.getUnitCost().compareTo(java.math.BigDecimal.ZERO) > 0)
                ? targetInv.getUnitCost()
                : (mat != null && mat.getUnitPriceStandard() != null ? mat.getUnitPriceStandard() : java.math.BigDecimal.ZERO);
        java.math.BigDecimal totalAmount = actualDeduct.multiply(unitPrice).setScale(2, java.math.RoundingMode.HALF_UP);

        targetInv.setQuantityOnHand(targetInv.getQuantityOnHand().subtract(actualDeduct));
        targetInv.setUpdatedAt(Instant.now());
        warehouseInventoryRepository.save(targetInv);

        String batchNum = targetInv.getBatchNumber() != null ? targetInv.getBatchNumber() : "DEFAULT";

        // 1. Tạo phiếu xuất
        String issueCode = "ISS-MAT-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        com.farm.saas.modules.inventory.entity.WarehouseIssue issue = com.farm.saas.modules.inventory.entity.WarehouseIssue.builder()
                .tenantId(task.getTenantId())
                .farmId(farmId)
                .warehouseId(warehouseId)
                .issueCode(issueCode)
                .issueType("PRODUCTION_BACKFLUSH")
                .isBackflushed(true)
                .seasonId(task.getCropSeasonId())
                .livestockGroupId(task.getLivestockGroupId())
                .receiverName("Công nhân hiện trường")
                .issueDate(LocalDate.now())
                .totalAmount(totalAmount)
                .status("COMPLETED")
                .approvedBy(currentUserId)
                .approvedAt(Instant.now())
                .notes("Tự động xuất " + actualDeduct + " " + matUnit + " " + matName + " khi hoàn thành công việc: " + task.getTaskTitle())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        issue = warehouseIssueRepository.save(issue);

        // 2. Tạo WarehouseIssueItem
        com.farm.saas.modules.inventory.entity.WarehouseIssueItem issueItem = com.farm.saas.modules.inventory.entity.WarehouseIssueItem.builder()
                .issueId(issue.getId())
                .tenantId(task.getTenantId())
                .materialId(materialId)
                .batchNumber(batchNum)
                .enteredUnit(matUnit)
                .enteredQuantity(actualDeduct)
                .conversionFactor(java.math.BigDecimal.ONE)
                .quantity(actualDeduct)
                .unitPrice(unitPrice)
                .totalPrice(totalAmount)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        issueItem = warehouseIssueItemRepository.save(issueItem);

        // 3. Ghi nhận giao dịch kho WarehouseInventoryTransaction
        if (warehouseInventoryTransactionRepository != null) {
            com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction trans = com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction.builder()
                    .tenantId(task.getTenantId())
                    .farmId(farmId)
                    .warehouseId(warehouseId)
                    .materialId(materialId)
                    .batchNumber(batchNum)
                    .transactionType("ISSUE")
                    .referenceDocType("WAREHOUSE_ISSUE")
                    .referenceDocId(issue.getId())
                    .referenceItemId(issueItem.getId())
                    .direction("OUT")
                    .quantity(actualDeduct)
                    .unitPrice(unitPrice)
                    .totalAmount(totalAmount)
                    .balanceBefore(targetInv.getQuantityOnHand().add(actualDeduct))
                    .balanceAfter(targetInv.getQuantityOnHand())
                    .transactionDate(LocalDate.now())
                    .notes("Tự động xuất kho vật tư khi hoàn thành việc #" + task.getId())
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            warehouseInventoryTransactionRepository.save(trans);
        }

        // 4. Hạch toán chi phí FarmExpense
        var costCats = costCategoryRepository.findByTenantIdAndCostType(task.getTenantId(), "MATERIALS");
        var targetCategory = costCats.isEmpty() ? null : costCats.get(0);
        if (task.getTaskType() != null) {
            if ("FERTILIZING".equalsIgnoreCase(task.getTaskType())) {
                targetCategory = costCats.stream().filter(c -> c.getCode() != null && c.getCode().contains("FERTILIZER")).findFirst().orElse(targetCategory);
            } else if ("FEEDING".equalsIgnoreCase(task.getTaskType())) {
                targetCategory = costCats.stream().filter(c -> c.getCode() != null && c.getCode().contains("FEED")).findFirst().orElse(targetCategory);
            }
        }

        if (targetCategory != null && (task.getCropSeasonId() != null || task.getLivestockGroupId() != null)) {
            String expenseCode = "EXP-MAT-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            com.farm.saas.modules.finance.entity.FarmExpense expense = com.farm.saas.modules.finance.entity.FarmExpense.builder()
                    .tenantId(task.getTenantId())
                    .farmId(farmId)
                    .seasonId(task.getCropSeasonId())
                    .livestockGroupId(task.getLivestockGroupId())
                    .costCategoryId(targetCategory.getId())
                    .expenseCode(expenseCode)
                    .expenseSource("INTERNAL")
                    .referenceId(issue.getId())
                    .expenseDate(LocalDate.now())
                    .amount(totalAmount)
                    .unitCostEligible(true)
                    .paymentMethod("INTERNAL_ALLOCATION")
                    .status("CONFIRMED")
                    .notes("Tự động hạch toán chi phí " + matName + " (" + actualDeduct + " " + matUnit + ") theo phiếu xuất " + issueCode)
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            farmExpenseRepository.save(expense);
        }

        task.setActualQuantity(actualDeduct);
        String backflushNote = "[ĐÃ XUẤT KHO VẬT TƯ: " + actualDeduct + " " + matUnit + " " + matName + " (Phiếu xuất: " + issueCode + ", Chi phí: " + String.format("%,.0f", totalAmount) + " đ)]";
        task.setCompletionNotes(notes + (notes.isBlank() ? "" : " | ") + backflushNote);
        farmTaskRepository.save(task);

        log.info("Auto-backflushed configured material: {} {}, cost={}, issue={}",
                actualDeduct, matUnit, totalAmount, issueCode);
    }

    private FarmTaskDetailResponse enrichTaskResponse(FarmTask t) {
        String farmName = farmRepository.findById(t.getFarmId()).map(Farm::getName).orElse(null);
        String zoneName = t.getZoneId() != null ? zoneRepository.findById(t.getZoneId()).map(z -> z.getName()).orElse(null) : null;

        String shiftName = null;
        String shiftCode = null;
        if (t.getShiftId() != null && workShiftRepository != null) {
            var ws = workShiftRepository.findById(t.getShiftId()).orElse(null);
            if (ws != null) {
                shiftName = ws.getName();
                shiftCode = ws.getShiftCode();
            }
        }

        String warehouseName = null;
        if (t.getWarehouseId() != null && warehouseRepository != null) {
            warehouseName = warehouseRepository.findById(t.getWarehouseId())
                    .map(com.farm.saas.modules.masterdata.entity.Warehouse::getName).orElse(null);
        }

        String materialName = null;
        String materialSku = null;
        String materialUnit = null;
        if (t.getMaterialId() != null && materialRepository != null) {
            var m = materialRepository.findById(t.getMaterialId()).orElse(null);
            if (m != null) {
                materialName = m.getName();
                materialSku = m.getSkuCode();
                materialUnit = m.getStandardUnit();
            }
        }

        String cropSeasonName = null;
        if (t.getCropSeasonId() != null && cropSeasonRepository != null) {
            cropSeasonName = cropSeasonRepository.findById(t.getCropSeasonId())
                    .map(com.farm.saas.modules.crop.entity.CropSeason::getSeasonCode).orElse(null);
        }

        String livestockGroupName = null;
        if (t.getLivestockGroupId() != null && livestockGroupRepository != null) {
            livestockGroupName = livestockGroupRepository.findById(t.getLivestockGroupId())
                    .map(com.farm.saas.modules.livestock.entity.LivestockGroup::getGroupCode).orElse(null);
        }

        String assignedEmpName = null;
        Boolean assignedToHasAccount = null;
        Long assignedToUserId = null;

        if (t.getAssignedToEmployeeId() != null) {
            Employee emp = employeeRepository.findById(t.getAssignedToEmployeeId()).orElse(null);
            if (emp != null) {
                assignedEmpName = emp.getFullName();
                assignedToHasAccount = emp.getUserId() != null;
                assignedToUserId = emp.getUserId();
            }
        }

        String assignerName = null;
        if (t.getAssignedByUserId() != null) {
            assignerName = userRepository.findById(t.getAssignedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        String locationName = null;
        String locationCode = null;
        if (t.getLocationId() != null && zoneLocationRepository != null) {
            var locOpt = zoneLocationRepository.findById(t.getLocationId());
            if (locOpt.isPresent()) {
                locationName = locOpt.get().getName();
                locationCode = locOpt.get().getCode();
            }
        }

        List<FarmTaskAssignee> assignees = farmTaskAssigneeRepository.findByTaskId(t.getId());
        List<FarmTaskDetailResponse.FarmTaskAssigneeResponse> assigneeResponses = new ArrayList<>();
        for (FarmTaskAssignee a : assignees) {
            Employee emp = employeeRepository.findById(a.getEmployeeId()).orElse(null);
            assigneeResponses.add(FarmTaskDetailResponse.FarmTaskAssigneeResponse.builder()
                    .employeeId(a.getEmployeeId())
                    .employeeName(emp != null ? emp.getFullName() : null)
                    .employeeCode(emp != null ? emp.getEmployeeCode() : null)
                    .hasUserAccount(emp != null && emp.getUserId() != null)
                    .userId(emp != null ? emp.getUserId() : null)
                    .roleInTask(a.getRoleInTask())
                    .assignedAt(a.getAssignedAt())
                    .build());
        }

        // Tính toán trạng thái trễ hạn (Overdue)
        Boolean isOverdue = false;
        Long overdueMinutes = 0L;
        String taskStatus = t.getStatus();

        if (!"DONE".equalsIgnoreCase(taskStatus) && !"CANCELLED".equalsIgnoreCase(taskStatus)) {
            Instant deadlineInstant = t.getDeadline();
            if (deadlineInstant == null && t.getEndTime() != null) {
                LocalDate taskDate = t.getCreatedAt() != null
                        ? LocalDate.ofInstant(t.getCreatedAt(), ZoneId.systemDefault())
                        : LocalDate.now();
                deadlineInstant = taskDate.atTime(t.getEndTime()).atZone(ZoneId.systemDefault()).toInstant();
            }

            if (deadlineInstant != null && Instant.now().isAfter(deadlineInstant)) {
                isOverdue = true;
                overdueMinutes = java.time.Duration.between(deadlineInstant, Instant.now()).toMinutes();
            }
        }

        return FarmTaskDetailResponse.builder()
                .id(t.getId())
                .farmId(t.getFarmId())
                .farmName(farmName)
                .zoneId(t.getZoneId())
                .zoneName(zoneName)
                .locationId(t.getLocationId())
                .locationName(locationName)
                .locationCode(locationCode)
                .taskTitle(t.getTaskTitle())
                .taskType(t.getTaskType())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignedToEmployeeId(t.getAssignedToEmployeeId())
                .assignedToEmployeeName(assignedEmpName)
                .assignedToHasAccount(assignedToHasAccount)
                .assignedToUserId(assignedToUserId)
                .assignedByUserId(t.getAssignedByUserId())
                .assignedByName(assignerName)
                .shiftId(t.getShiftId())
                .shiftName(shiftName)
                .shiftCode(shiftCode)
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .recurrenceDays(t.getRecurrenceDays())
                .assignmentMode(t.getAssignmentMode())
                .warehouseId(t.getWarehouseId())
                .warehouseName(warehouseName)
                .materialId(t.getMaterialId())
                .materialName(materialName)
                .materialSku(materialSku)
                .materialUnit(materialUnit)
                .standardQuantity(t.getStandardQuantity())
                .actualQuantity(t.getActualQuantity())
                .cropSeasonId(t.getCropSeasonId())
                .cropSeasonName(cropSeasonName)
                .livestockGroupId(t.getLivestockGroupId())
                .livestockGroupName(livestockGroupName)
                .deadline(t.getDeadline())
                .completionNotes(t.getCompletionNotes())
                .photosJson(t.getPhotosJson())
                .isOverdue(isOverdue)
                .overdueMinutes(overdueMinutes)
                .assignees(assigneeResponses)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    /**
     * Helper kiểm tra xem ca làm việc của nhân sự có bao trọn (chứa hoàn toàn) khung giờ của công việc không.
     * Quy tắc cốt lõi: shift.startTime <= task.startTime VÀ shift.endTime >= task.endTime
     */
    public static boolean isShiftCoveringTask(com.farm.saas.modules.masterdata.entity.WorkShift ws, LocalTime taskStart, LocalTime taskEnd) {
        if (ws == null || ws.getStartTime() == null || ws.getEndTime() == null || taskStart == null || taskEnd == null) {
            return false;
        }
        LocalTime sStart = ws.getStartTime();
        LocalTime sEnd = ws.getEndTime();
        boolean isOvernight = Boolean.TRUE.equals(ws.getIsOvernight()) || sEnd.isBefore(sStart);

        if (!isOvernight) {
            // Ca ngày bình thường (ví dụ: 06:00 - 14:00)
            if (!taskStart.isAfter(taskEnd)) {
                return !sStart.isAfter(taskStart) && !sEnd.isBefore(taskEnd);
            } else {
                return false;
            }
        } else {
            // Ca đêm qua ngày hôm sau (ví dụ: 22:00 - 06:00)
            if (!taskStart.isAfter(taskEnd)) {
                boolean inNightBefore = !taskStart.isBefore(sStart); // taskStart >= sStart (ví dụ 23:00)
                boolean inMorningAfter = !taskEnd.isAfter(sEnd);     // taskEnd <= sEnd (ví dụ 05:00)
                return inNightBefore || inMorningAfter;
            } else {
                return !sStart.isAfter(taskStart) && !sEnd.isBefore(taskEnd);
            }
        }
    }
}
