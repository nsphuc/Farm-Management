package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.Warehouse;
import com.farmsaas.modules.inventory.entity.enums.WarehouseType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String code;
    private String name;
    private WarehouseType warehouseType;
    private String locationDesc;
    private Long managerUserId;
    private String managerName;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static WarehouseResponse fromEntity(Warehouse entity) {
        if (entity == null) return null;
        return WarehouseResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarm() != null ? entity.getFarm().getName() : null)
                .code(entity.getCode())
                .name(entity.getName())
                .warehouseType(entity.getWarehouseType())
                .locationDesc(entity.getLocationDesc())
                .managerUserId(entity.getManagerUserId())
                .managerName(entity.getManager() != null ? entity.getManager().getFullName() : null)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
