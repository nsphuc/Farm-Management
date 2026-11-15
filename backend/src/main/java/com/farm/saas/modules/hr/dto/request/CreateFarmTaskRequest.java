package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFarmTaskRequest {

    private Long zoneId;

    private Long locationId;

    @NotBlank(message = "Tiêu đề nhiệm vụ không được để trống")
    private String taskTitle;

    @NotBlank(message = "Loại nhiệm vụ không được để trống")
    @Pattern(regexp = "PLANTING|FERTILIZING|HARVESTING|FEEDING|MAINTENANCE|SANITATION", message = "taskType phải là PLANTING, FERTILIZING, HARVESTING, FEEDING, MAINTENANCE hoặc SANITATION")
    private String taskType;

    @NotBlank(message = "Mức độ ưu tiên không được để trống")
    @Pattern(regexp = "LOW|MEDIUM|HIGH|URGENT", message = "priority phải là LOW, MEDIUM, HIGH hoặc URGENT")
    private String priority;

    private Long assignedToEmployeeId;

    private Instant deadline;

    private Long shiftId;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String recurrenceDays;

    private String assignmentMode;

    private Long warehouseId;

    private Long materialId;

    private java.math.BigDecimal standardQuantity;

    private java.math.BigDecimal actualQuantity;

    private Long cropSeasonId;

    private Long livestockGroupId;

    private String completionNotes;

    private String photosJson;

    @Valid
    private List<TaskAssigneeItemRequest> assignees;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskAssigneeItemRequest {
        @NotNull(message = "Nhân viên không được để trống")
        private Long employeeId;

        @Pattern(regexp = "LEADER|MEMBER", message = "roleInTask phải là LEADER hoặc MEMBER")
        private String roleInTask;
    }
}
