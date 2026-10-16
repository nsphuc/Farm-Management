package com.farm.saas.modules.inventory.mapper;

import com.farm.saas.modules.inventory.dto.request.MaterialCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialResponse;
import com.farm.saas.modules.inventory.entity.Material;
import com.farm.saas.modules.inventory.entity.MaterialCategory;

/**
 * Mapper chuyển đổi giữa Material Entity và Request/Response DTO.
 */
public final class MaterialMapper {

    private MaterialMapper() {
    }

    public static Material toEntity(MaterialCreateRequest request, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return Material.builder()
                .tenantId(tenantId)
                .categoryId(request.getCategoryId())
                .skuCode(request.getSkuCode().trim().toUpperCase())
                .name(request.getName().trim())
                .standardUnit(request.getStandardUnit())
                .dispatchStrategy(request.getDispatchStrategy())
                .expiryAlertDays(request.getExpiryAlertDays())
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .unitPriceStandard(request.getUnitPriceStandard())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static void updateEntity(Material entity, MaterialUpdateRequest request, Long currentUserId) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCategoryId(request.getCategoryId());
        entity.setName(request.getName().trim());
        entity.setStandardUnit(request.getStandardUnit());
        entity.setDispatchStrategy(request.getDispatchStrategy());
        entity.setExpiryAlertDays(request.getExpiryAlertDays());
        entity.setMinStockLevel(request.getMinStockLevel());
        entity.setMaxStockLevel(request.getMaxStockLevel());
        entity.setUnitPriceStandard(request.getUnitPriceStandard());
        entity.setUpdatedBy(currentUserId);
    }

    public static MaterialResponse toResponse(Material entity, MaterialCategory category) {
        if (entity == null) {
            return null;
        }

        String catCode = category != null ? category.getCode() : null;
        String catName = category != null ? category.getName() : null;

        return MaterialResponse.builder()
                .id(entity.getId())
                .categoryId(entity.getCategoryId())
                .categoryCode(catCode)
                .categoryName(catName)
                .skuCode(entity.getSkuCode())
                .name(entity.getName())
                .standardUnit(entity.getStandardUnit())
                .dispatchStrategy(entity.getDispatchStrategy())
                .expiryAlertDays(entity.getExpiryAlertDays())
                .minStockLevel(entity.getMinStockLevel())
                .maxStockLevel(entity.getMaxStockLevel())
                .unitPriceStandard(entity.getUnitPriceStandard())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static MaterialResponse toResponse(Material entity) {
        return toResponse(entity, null);
    }
}
