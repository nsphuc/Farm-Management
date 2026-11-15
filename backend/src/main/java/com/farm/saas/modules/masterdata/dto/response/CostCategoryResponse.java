package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCategoryResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String applicableFarms;
    private List<Long> applicableFarmIds;
    private List<String> applicableFarmNames;
    private String code;
    private String name;
    private String costType;
    private String description;
    private Instant createdAt;
}
