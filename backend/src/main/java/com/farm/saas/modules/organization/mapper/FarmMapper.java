package com.farm.saas.modules.organization.mapper;

import com.farm.saas.modules.organization.dto.request.FarmCreateRequest;
import com.farm.saas.modules.organization.dto.response.FarmResponse;
import com.farm.saas.modules.organization.entity.Farm;

import java.math.BigDecimal;

/**
 * Mapper chuyển đổi giữa Farm Entity và các DTO tương ứng.
 */
public final class FarmMapper {

    private FarmMapper() {
    }

    public static Farm toEntity(FarmCreateRequest request, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return Farm.builder()
                .tenantId(tenantId)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .farmType(request.getFarmType().trim().toUpperCase())
                .totalAreaM2(request.getTotalAreaM2() != null ? request.getTotalAreaM2() : BigDecimal.ZERO)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .managerUserId(request.getManagerUserId())
                .status("ACTIVE") // Mặc định gán ACTIVE theo quy tắc nghiệp vụ
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static FarmResponse toResponse(Farm entity) {
        if (entity == null) {
            return null;
        }

        return FarmResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .code(entity.getCode())
                .name(entity.getName())
                .farmType(entity.getFarmType())
                .totalAreaM2(entity.getTotalAreaM2())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .address(entity.getAddress())
                .managerUserId(entity.getManagerUserId())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
