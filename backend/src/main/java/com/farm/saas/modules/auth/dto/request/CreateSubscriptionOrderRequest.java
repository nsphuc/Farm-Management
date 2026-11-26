package com.farm.saas.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubscriptionOrderRequest {

    @NotBlank(message = "Mã dịch vụ Add-on không được để trống")
    private String addonCode; // BRANCHES, PAYROLL, CUSTOM_ROLES, BREEDING, POULTRY_HATCHERY, FEED_MILL

    @Builder.Default
    private String packagePlan = "MONTHLY"; // MONTHLY (30 ngày), YEARLY (365 ngày)

    private String returnUrl;
}
