package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDeliveryPodRequest {

    @NotBlank(message = "Ảnh chứng từ giao hàng POD không được để trống")
    private String proofOfDeliveryUrl;

    private String receiverName;

    private String notes;
}
