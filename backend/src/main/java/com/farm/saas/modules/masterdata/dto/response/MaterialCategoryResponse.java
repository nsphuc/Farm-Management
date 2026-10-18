package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCategoryResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String description;
    private Long materialsCount;
    private Instant createdAt;
}
