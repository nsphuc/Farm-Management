package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.request.BroadcastNotificationRequest;
import com.farm.saas.modules.platform.dto.response.BroadcastNotificationResponse;
import com.farm.saas.modules.platform.service.PlatformNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/notifications")
@RequiredArgsConstructor
@Tag(name = "Platform Notifications", description = "Phát thông báo hệ thống diện rộng toàn nền tảng SaaS")
public class PlatformNotificationController {

    private final PlatformNotificationService platformNotificationService;

    @PostMapping("/broadcast")
    @PreAuthorize("hasAuthority('PERM_TENANT_MANAGE') or hasRole('ROLE_SUPER_ADMIN')")
    @Operation(summary = "Phát thông báo diện rộng tới toàn bộ khách thuê hoặc nhóm khách thuê cụ thể")
    public ResponseEntity<BroadcastNotificationResponse> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request) {
        BroadcastNotificationResponse response = platformNotificationService.broadcast(request);
        return ResponseEntity.ok(response);
    }
}

