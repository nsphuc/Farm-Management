package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmTaskRequest {

    private String taskCode;

    @NotBlank(message = "Tiêu đề công việc không được để trống")
    private String title;

    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private Long assignedTo;
    private Long supervisorId;
    private Long seasonId;
    private Long herdId;
    private Long zoneId;
    private LocalDate dueDate;
    private LocalDateTime startTime;
    private LocalDateTime completedAt;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private String notes;
}
