package com.farm.saas.modules.inventory.mapper;

import com.farm.saas.modules.inventory.dto.request.WarehouseCreateRequest;
import com.farm.saas.modules.inventory.dto.request.WarehouseUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseResponse;
import com.farm.saas.modules.inventory.entity.Warehouse;
import com.farm.saas.modules.inventory.entity.WarehouseStatus;

/**
 * Mapper chuyển đổi giữa Warehouse Entity và Request/Response DTO.
 */
public final class WarehouseMapper {

    private WarehouseMapper() {
    }

    public static Warehouse toEntity(WarehouseCreateRequest request, Long tenantId, Long farmId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return Warehouse.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .warehouseType(request.getWarehouseType())
                .locationDesc(request.getLocationDesc() != null ? request.getLocationDesc().trim() : null)
                .managerUserId(request.getManagerUserId())
                .status(WarehouseStatus.ACTIVE)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static void updateEntity(Warehouse entity, WarehouseUpdateRequest request, Long currentUserId) {
        if (entity == null || request == null) {
            return;
        }

        entity.setName(request.getName().trim());
        entity.setWarehouseType(request.getWarehouseType());
        entity.setLocationDesc(request.getLocationDesc() != null ? request.getLocationDesc().trim() : null);
        entity.setManagerUserId(request.getManagerUserId());
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        entity.setUpdatedBy(currentUserId);
    }

    public static WarehouseResponse toResponse(Warehouse entity) {
        if (entity == null) {
            return null;
        }

        return WarehouseResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .code(entity.getCode())
                .name(entity.getName())
                .warehouseType(entity.getWarehouseType())
                .locationDesc(entity.getLocationDesc())
                .managerUserId(entity.getManagerUserId())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
