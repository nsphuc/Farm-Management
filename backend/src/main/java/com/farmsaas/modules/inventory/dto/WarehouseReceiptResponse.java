package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.WarehouseReceipt;
import com.farmsaas.modules.inventory.entity.WarehouseReceiptItem;
import com.farmsaas.modules.inventory.entity.enums.ReceiptType;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String receiptCode;
    private ReceiptType receiptType;
    private Long partnerId;
    private String partnerName;
    private Instant receiptDate;
    private BigDecimal totalAmount;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ReceiptItemResponse> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItemResponse {
        private Long id;
        private Long materialId;
        private String materialSku;
        private String materialName;
        private StandardUnit standardUnit;
        private String batchNumber;
        private LocalDate expiryDate;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String storageBinCode;

        public static ReceiptItemResponse fromEntity(WarehouseReceiptItem entity) {
            if (entity == null) return null;
            return ReceiptItemResponse.builder()
                    .id(entity.getId())
                    .materialId(entity.getMaterialId())
                    .materialSku(entity.getMaterial() != null ? entity.getMaterial().getSkuCode() : null)
                    .materialName(entity.getMaterial() != null ? entity.getMaterial().getName() : null)
                    .standardUnit(entity.getMaterial() != null ? entity.getMaterial().getStandardUnit() : null)
                    .batchNumber(entity.getBatchNumber())
                    .expiryDate(entity.getExpiryDate())
                    .quantity(entity.getQuantity())
                    .unitPrice(entity.getUnitPrice())
                    .subtotal(entity.getSubtotal())
                    .storageBinCode(entity.getStorageBinCode())
                    .build();
        }
    }

    public static WarehouseReceiptResponse fromEntity(WarehouseReceipt entity) {
        if (entity == null) return null;
        List<ReceiptItemResponse> items = entity.getItems() != null ?
                entity.getItems().stream().map(ReceiptItemResponse::fromEntity).collect(Collectors.toList()) :
                List.of();

        return WarehouseReceiptResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .warehouseId(entity.getWarehouseId())
                .warehouseName(entity.getWarehouse() != null ? entity.getWarehouse().getName() : null)
                .receiptCode(entity.getReceiptCode())
                .receiptType(entity.getReceiptType())
                .partnerId(entity.getPartnerId())
                .partnerName(entity.getPartner() != null ? entity.getPartner().getName() : null)
                .receiptDate(entity.getReceiptDate())
                .totalAmount(entity.getTotalAmount())
                .notes(entity.getNotes())
                .createdByUserId(entity.getCreatedByUserId())
                .createdByUserName(entity.getCreatedByUser() != null ? entity.getCreatedByUser().getFullName() : null)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(items)
                .build();
    }
}
