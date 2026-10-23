package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustAttendanceRequest {

    private Instant checkInTime;
    private Instant checkOutTime;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    @jakarta.validation.constraints.Size(min = 10, message = "Lý do điều chỉnh phải có tối thiểu 10 ký tự để phục vụ kiểm toán")
    private String adjustmentReason;
}
