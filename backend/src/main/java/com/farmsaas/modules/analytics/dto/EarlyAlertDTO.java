package com.farmsaas.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarlyAlertDTO {
    private String id;
    private String severity; // CRITICAL, WARNING, INFO
    private String category; // INVENTORY_EXPIRY, INVENTORY_MIN_STOCK, OVERDUE_TASK, OVERDUE_DEBT, ANOMALY
    private String title;
    private String message;
    private Long targetId;
    private LocalDateTime timestamp;
    private String actionUrl;
}
