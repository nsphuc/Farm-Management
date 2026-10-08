package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.CostType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCategoryResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private CostType costType;
    private String description;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
