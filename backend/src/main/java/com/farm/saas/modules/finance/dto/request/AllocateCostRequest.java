package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllocateCostRequest {

    @NotEmpty(message = "Danh sách phân bổ chi phí không được để trống")
    @Valid
    private List<CostAllocationItemRequest> allocations;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostAllocationItemRequest {

        @NotBlank(message = "targetType không được để trống")
        @Pattern(regexp = "CROP_SEASON|LIVESTOCK_GROUP|PRODUCTION_ZONE",
                message = "targetType phải là CROP_SEASON, LIVESTOCK_GROUP hoặc PRODUCTION_ZONE")
        private String targetType;

        @NotNull(message = "targetId không được để trống")
        private Long targetId;

        @NotNull(message = "allocatedAmount không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền phân bổ phải lớn hơn 0")
        private BigDecimal allocatedAmount;
    }
}
