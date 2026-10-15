package com.farm.saas.modules.organization.mapper;

import com.farm.saas.modules.organization.dto.request.ZoneLocationCreateRequest;
import com.farm.saas.modules.organization.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.organization.entity.ZoneLocation;

/**
 * Mapper chuyển đổi giữa ZoneLocation Entity và các DTO tương ứng.
 */
public final class ZoneLocationMapper {

    private ZoneLocationMapper() {
    }

    public static ZoneLocation toEntity(ZoneLocationCreateRequest request, Long farmId, Long zoneId, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return ZoneLocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(zoneId)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status("ACTIVE") // Mặc định gán ACTIVE theo quy tắc nghiệp vụ
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static ZoneLocationResponse toResponse(ZoneLocation entity) {
        if (entity == null) {
            return null;
        }

        return ZoneLocationResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .zoneId(entity.getZoneId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
