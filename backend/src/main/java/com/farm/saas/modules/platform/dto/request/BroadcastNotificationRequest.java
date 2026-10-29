package com.farm.saas.modules.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastNotificationRequest {

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String message;

    @Builder.Default
    private String type = "SYSTEM"; // SYSTEM, ALERT, WARNING, INFO

    private Long targetTenantId; // null = tất cả Tenant đang ACTIVE

    @Builder.Default
    private Boolean onlyOwners = true; // true = chỉ gửi ROLE_FARM_OWNER; false = toàn bộ user ACTIVE
}

