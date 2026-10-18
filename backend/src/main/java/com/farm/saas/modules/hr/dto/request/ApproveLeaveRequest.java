package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveLeaveRequest {

    @NotBlank(message = "Trạng thái phê duyệt không được để trống")
    @Pattern(regexp = "APPROVED|REJECTED", message = "status phải là APPROVED hoặc REJECTED")
    private String status;

    private String rejectionReason;
}
