package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLivestockIndividualRequest {

    private Long zoneId;

    private Long groupId;

    @Pattern(regexp = "^(MALE|FEMALE|CASTRATED)$", message = "Giới tính phải là MALE, FEMALE hoặc CASTRATED")
    private String gender;

    @DecimalMin(value = "0.00", message = "Cân nặng hiện tại không được âm")
    private BigDecimal currentWeightKg;

    @Pattern(regexp = "^(HEALTHY|SICK|INJURED|QUARANTINED|DECEASED|SOLD)$", message = "Tình trạng sức khỏe không hợp lệ")
    private String healthStatus;
}
