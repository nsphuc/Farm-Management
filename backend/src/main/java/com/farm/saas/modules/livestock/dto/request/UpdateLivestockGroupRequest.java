package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLivestockGroupRequest {

    private Long zoneId;

    private Long locationId;

    @Min(value = 0, message = "Số lượng hiện tại không được âm")
    private Integer currentQuantity;

    @Pattern(regexp = "^(ACTIVE|QUARANTINED|SOLD|CULLED)$", message = "Trạng thái đàn không hợp lệ")
    private String status;
}
