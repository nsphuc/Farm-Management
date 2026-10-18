package com.farm.saas.modules.quality.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectProductBatchRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String rejectionReason;
}
