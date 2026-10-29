package com.farm.saas.modules.hr.service.impl;

import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.common.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
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


    @Override
    @Transactional
    public FarmTaskDetailResponse createTask(Long farmId, CreateFarmTaskRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Farm farm = farmRepository.findById(farmId)
                .filter(f -> tenantId == null || f.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        FarmTask task = FarmTask.builder()
                .tenantId(farm.getTenantId())
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
            } catch (Exception ex) {
                log.warn("Failed to send task assignment notification: {}", ex.getMessage());
            }
        }

        return enrichTaskResponse(task);
    }

    @Override
    @Transactional
    public FarmTaskDetailResponse updateTask(Long farmId, Long taskId, CreateFarmTaskRequest request) {
        com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest updateReq = com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest.builder()
                .zoneId(request.getZoneId())
                .taskTitle(request.getTaskTitle())
                .taskType(request.getTaskType())
                .priority(request.getPriority())
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
        task.setAssignedToEmployeeId(request.getAssignedToEmployeeId());
        task.setDeadline(request.getDeadline());
        if (request.getCompletionNotes() != null) {
            task.setCompletionNotes(request.getCompletionNotes());
        }
        if (request.getPhotosJson() != null) {
            task.setPhotosJson(request.getPhotosJson());
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
        task.setUpdatedAt(Instant.now());
        task.setUpdatedBy(currentUserId);

        task = farmTaskRepository.save(task);
        log.info("Updated task id={} status from {} to {}", task.getId(), oldStatus, task.getStatus());

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
                    if (farm.getManagerUserId() != null && !farm.getManagerUserId().equals(currentUserId)) {
                        recipientUserIds.add(farm.getManagerUserId());
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
        if ("DONE".equalsIgnoreCase(targetStatus) && notificationService != null) {
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
                // Chưa có việc cho hôm nay -> Sinh nhiệm vụ mới cho ngày hôm nay
                FarmTask newTask = FarmTask.builder()
                        .tenantId(farm.getTenantId())
                        .farmId(farm.getId())
                        .zoneId(latest.getZoneId())
                        .taskTitle(latest.getTaskTitle())
                        .taskType(latest.getTaskType())
                        .priority(latest.getPriority())
                        .assignedToEmployeeId(latest.getAssignedToEmployeeId())
                        .assignedByUserId(currentUserId != null ? currentUserId : latest.getAssignedByUserId())
                        .deadline(today.atTime(18, 0).atZone(ZoneId.systemDefault()).toInstant())
                        .status("TODO")
                        .completionNotes("Tự động khởi tạo từ công việc cố định hàng ngày")
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                newTask = farmTaskRepository.save(newTask);

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

    private FarmTaskDetailResponse enrichTaskResponse(FarmTask t) {
        String farmName = farmRepository.findById(t.getFarmId()).map(Farm::getName).orElse(null);
        String zoneName = t.getZoneId() != null ? zoneRepository.findById(t.getZoneId()).map(z -> z.getName()).orElse(null) : null;

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
                .assignedToHasAccount(assignedToHasAccount)
                .assignedToUserId(assignedToUserId)
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
