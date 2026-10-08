package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmTaskResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String taskCode;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private Long assignedTo;
    private String assigneeName;
    private Long supervisorId;
    private String supervisorName;
    private Long seasonId;
    private String seasonCode;
    private Long herdId;
    private String herdCode;
    private Long zoneId;
    private String zoneName;
    private LocalDate dueDate;
    private LocalDateTime startTime;
    private LocalDateTime completedAt;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private String notes;
    private java.time.Instant createdAt;
    private java.time.Instant updatedAt;
}
