package com.farm.saas.modules.quality.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecallProductBatchRequest {

    @NotBlank(message = "Lý do thu hồi không được để trống")
    private String recallReason;
}
