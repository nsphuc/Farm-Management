package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFarmTaskRequest {

    private Long zoneId;

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

    private String completionNotes;

    private String photosJson;

    @Valid
    private List<CreateFarmTaskRequest.TaskAssigneeItemRequest> assignees;
}
