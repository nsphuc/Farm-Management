package com.farmsaas.modules.hr.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.hr.dto.FarmTaskRequest;
import com.farmsaas.modules.hr.dto.FarmTaskResponse;
import com.farmsaas.modules.hr.dto.TaskStatusUpdateRequest;
import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import com.farmsaas.modules.hr.service.FarmTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/tasks")
@RequiredArgsConstructor
public class FarmTaskController {

    private final FarmTaskService farmTaskService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<FarmTaskResponse>>> searchTasks(
            @PathVariable Long farmId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long herdId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FarmTaskResponse> result = farmTaskService.searchTasks(farmId, keyword, status, priority, assignedTo, seasonId, zoneId, herdId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result), "Tìm kiếm danh sách công việc thành công."));
    }

    @GetMapping("/kanban")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<TaskStatus, List<FarmTaskResponse>>>> getKanbanBoard(
            @PathVariable Long farmId,
            @RequestParam(required = false) Long assignedTo
    ) {
        Map<TaskStatus, List<FarmTaskResponse>> kanban = farmTaskService.getKanbanBoard(farmId, assignedTo);
        return ResponseEntity.ok(ApiResponse.success(kanban, "Lấy dữ liệu bảng Kanban thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FarmTaskResponse>> getTaskById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        FarmTaskResponse response = farmTaskService.getTaskById(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin chi tiết công việc thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<FarmTaskResponse>> createTask(
            @PathVariable Long farmId,
            @Valid @RequestBody FarmTaskRequest request
    ) {
        FarmTaskResponse response = farmTaskService.createTask(farmId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Khởi tạo công việc mới thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<FarmTaskResponse>> updateTask(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody FarmTaskRequest request
    ) {
        FarmTaskResponse response = farmTaskService.updateTask(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật công việc thành công."));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FarmTaskResponse>> updateTaskStatus(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request
    ) {
        FarmTaskResponse response = farmTaskService.updateTaskStatus(farmId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái công việc thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        farmTaskService.deleteTask(farmId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa công việc thành công."));
    }
}
