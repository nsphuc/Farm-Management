package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.WarehouseTransfer;
import com.farmsaas.modules.inventory.entity.WarehouseTransferItem;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseTransferResponse {

    private Long id;
    private Long tenantId;
    private String transferCode;
    private Long fromWarehouseId;
    private String fromWarehouseName;
    private Long toWarehouseId;
    private String toWarehouseName;
    private Instant transferDate;
    private TransferStatus status;
    private String notes;
    private Long requestedByUserId;
    private String requestedByUserName;
    private Instant dispatchedAt;
    private Instant receivedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private List<TransferItemResponse> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferItemResponse {
        private Long id;
        private Long materialId;
        private String materialSku;
        private String materialName;
        private StandardUnit standardUnit;
        private String batchNumber;
        private BigDecimal quantity;

        public static TransferItemResponse fromEntity(WarehouseTransferItem entity) {
            if (entity == null) return null;
            return TransferItemResponse.builder()
                    .id(entity.getId())
                    .materialId(entity.getMaterialId())
                    .materialSku(entity.getMaterial() != null ? entity.getMaterial().getSkuCode() : null)
                    .materialName(entity.getMaterial() != null ? entity.getMaterial().getName() : null)
                    .standardUnit(entity.getMaterial() != null ? entity.getMaterial().getStandardUnit() : null)
                    .batchNumber(entity.getBatchNumber())
                    .quantity(entity.getQuantity())
                    .build();
        }
    }

    public static WarehouseTransferResponse fromEntity(WarehouseTransfer entity) {
        if (entity == null) return null;
        List<TransferItemResponse> items = entity.getItems() != null ?
                entity.getItems().stream().map(TransferItemResponse::fromEntity).collect(Collectors.toList()) :
                List.of();

        return WarehouseTransferResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .transferCode(entity.getTransferCode())
                .fromWarehouseId(entity.getFromWarehouseId())
                .fromWarehouseName(entity.getFromWarehouse() != null ? entity.getFromWarehouse().getName() : null)
                .toWarehouseId(entity.getToWarehouseId())
                .toWarehouseName(entity.getToWarehouse() != null ? entity.getToWarehouse().getName() : null)
                .transferDate(entity.getTransferDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .requestedByUserId(entity.getRequestedByUserId())
                .requestedByUserName(entity.getRequestedByUser() != null ? entity.getRequestedByUser().getFullName() : null)
                .dispatchedAt(entity.getDispatchedAt())
                .receivedAt(entity.getReceivedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(items)
                .build();
    }
}
