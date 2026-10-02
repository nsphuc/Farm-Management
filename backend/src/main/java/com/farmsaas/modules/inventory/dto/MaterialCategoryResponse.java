package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.MaterialCategory;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCategoryResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    public static MaterialCategoryResponse fromEntity(MaterialCategory entity) {
        if (entity == null) return null;
        return MaterialCategoryResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
