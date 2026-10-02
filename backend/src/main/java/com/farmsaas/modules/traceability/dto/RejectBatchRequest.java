package com.farmsaas.modules.traceability.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectBatchRequest {

    @NotBlank(message = "Lý do từ chối kiểm định lô không được để trống.")
    private String rejectionReason;
}
