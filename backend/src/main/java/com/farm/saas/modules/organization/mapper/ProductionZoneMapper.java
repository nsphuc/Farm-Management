package com.farm.saas.modules.organization.mapper;

import com.farm.saas.modules.organization.dto.request.ProductionZoneCreateRequest;
import com.farm.saas.modules.organization.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.organization.entity.ProductionZone;

import java.math.BigDecimal;

/**
 * Mapper chuyển đổi giữa ProductionZone Entity và các DTO tương ứng.
 */
public final class ProductionZoneMapper {

    private ProductionZoneMapper() {
    }

    public static ProductionZone toEntity(ProductionZoneCreateRequest request, Long farmId, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return ProductionZone.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .zoneType(request.getZoneType().trim().toUpperCase())
                .areaM2(request.getAreaM2() != null ? request.getAreaM2() : BigDecimal.ZERO)
                .soilType(request.getSoilType() != null ? request.getSoilType().trim() : null)
                .waterSource(request.getWaterSource() != null ? request.getWaterSource().trim() : null)
                .status("ACTIVE") // Mặc định gán ACTIVE theo quy tắc nghiệp vụ
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static ProductionZoneResponse toResponse(ProductionZone entity) {
        if (entity == null) {
            return null;
        }

        return ProductionZoneResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .code(entity.getCode())
                .name(entity.getName())
                .zoneType(entity.getZoneType())
                .areaM2(entity.getAreaM2())
                .soilType(entity.getSoilType())
                .waterSource(entity.getWaterSource())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
