package com.farm.saas.modules.inventory.mapper;

import com.farm.saas.modules.inventory.dto.request.MaterialCategoryCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialCategoryUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.inventory.entity.MaterialCategory;

/**
 * Mapper chuyển đổi giữa MaterialCategory Entity và Request/Response DTO.
 */
public final class MaterialCategoryMapper {

    private MaterialCategoryMapper() {
    }

    public static MaterialCategory toEntity(MaterialCategoryCreateRequest request, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return MaterialCategory.builder()
                .tenantId(tenantId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static void updateEntity(MaterialCategory entity, MaterialCategoryUpdateRequest request, Long currentUserId) {
        if (entity == null || request == null) {
            return;
        }

        entity.setName(request.getName().trim());
        entity.setUpdatedBy(currentUserId);
    }

    public static MaterialCategoryResponse toResponse(MaterialCategory entity) {
        if (entity == null) {
            return null;
        }

        return MaterialCategoryResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
