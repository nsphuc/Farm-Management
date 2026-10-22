package com.farm.saas.modules.finance.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmSettlementRequest {

    private String settlementTransactionCode;
    private String settlementProofUrl;
    private String notes;
}
