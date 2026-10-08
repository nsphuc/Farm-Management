package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusUpdateRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private TaskStatus status;

    private BigDecimal actualHours;
    private String notes;
}
