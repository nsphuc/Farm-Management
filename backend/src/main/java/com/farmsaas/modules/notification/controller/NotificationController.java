package com.farmsaas.modules.notification.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.notification.dto.NotificationResponse;
import com.farmsaas.modules.notification.dto.SendNotificationRequest;
import com.farmsaas.modules.notification.service.NotificationService;
import com.farmsaas.security.service.UserPrincipal;
import com.farmsaas.tenant.TenantContextHolder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách thông báo phân trang của người dùng hiện tại trong Tenant.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<NotificationResponse> response = notificationService.getCurrentUserNotifications(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Lấy số lượng thông báo chưa đọc của người dùng hiện tại.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable Long id) {
        NotificationResponse updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đã đánh dấu đọc thông báo thành công."));
    }

    /**
     * Đánh dấu toàn bộ thông báo của người dùng trong Tenant là đã đọc.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đọc tất cả thông báo."));
    }

    /**
     * Endpoint Server-Sent Events (SSE) để client nhận thông báo đẩy thời gian thực.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long tenantId = TenantContextHolder.getTenantId();
        return notificationService.subscribeSse(userPrincipal.getId(), tenantId);
    }

    /**
     * API gửi thông báo chủ động (Dành cho Farm Owner hoặc Super Admin / Internal Triggers).
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_OWNER')")
    public ResponseEntity<ApiResponse<NotificationResponse>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request
    ) {
        Long tenantId = TenantContextHolder.getTenantId();
        NotificationResponse response = notificationService.sendNotification(tenantId, request);
        return ResponseEntity.status(201).body(ApiResponse.created(response, "Đã gửi thông báo thành công."));
    }
}
