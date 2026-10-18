package com.farm.saas.modules.notification.controller;

import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.notification.dto.NotificationResponse;
import com.farm.saas.modules.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Trung tâm thông báo hệ thống và người dùng")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Danh sách thông báo của người dùng", description = "Lấy danh sách thông báo phân trang, có thể lọc theo trạng thái đã đọc và loại thông báo")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) String type,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUserId, isRead, type, pageable));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu thông báo đã đọc", description = "Cập nhật trạng thái is_read = true cho một thông báo")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationService.markAsRead(currentUserId, id));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc", description = "Cập nhật tất cả thông báo chưa đọc của người dùng thành đã đọc")
    public ResponseEntity<Void> markAllAsRead() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(currentUserId);
        return ResponseEntity.noContent().build();
    }
}
