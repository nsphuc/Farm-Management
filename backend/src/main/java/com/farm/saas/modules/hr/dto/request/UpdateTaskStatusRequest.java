package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskStatusRequest {

    @NotBlank(message = "Trạng thái nhiệm vụ không được để trống")
    @Pattern(regexp = "TODO|IN_PROGRESS|PENDING_REVIEW|DONE|CANCELLED", message = "status phải là TODO, IN_PROGRESS, PENDING_REVIEW, DONE hoặc CANCELLED")
    private String status;

    private String completionNotes;
    private String photosJson;
}
