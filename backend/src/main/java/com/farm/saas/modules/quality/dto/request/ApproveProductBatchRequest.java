package com.farm.saas.modules.quality.dto.request;

import lombok.*;

/**
 * DTO yêu cầu phê duyệt chất lượng KCS cho lô thành phẩm (Maker-Checker).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveProductBatchRequest {
    private String notes;
}
