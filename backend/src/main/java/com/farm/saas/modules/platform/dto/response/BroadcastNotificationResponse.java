package com.farm.saas.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastNotificationResponse {

    private String message;
    private int recipientCount;
    private String type;
    private Long targetTenantId;
    private Boolean onlyOwners;
    private LocalDateTime broadcastAt;
}

