package com.farm.saas.modules.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionOrderDetailResponse {
    private Long id;
    private String orderCode;
    private Long farmId;
    private String addonCode;
    private String addonName;
    private String packagePlan;
    private Integer durationMonths;
    private BigDecimal amount;
    private String status;
    private String paymentGateway;
    private String paymentUrl;
    private Instant paidAt;
    private Instant createdAt;
}
