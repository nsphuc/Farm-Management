package com.farmsaas.modules.traceability.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecallBatchRequest {

    @NotBlank(message = "Lý do thu hồi khẩn cấp không được để trống.")
    private String recallReason;
}
