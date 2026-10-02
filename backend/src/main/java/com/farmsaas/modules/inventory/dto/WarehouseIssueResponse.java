package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.WarehouseIssue;
import com.farmsaas.modules.inventory.entity.WarehouseIssueItem;
import com.farmsaas.modules.inventory.entity.enums.IssueType;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
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
public class WarehouseIssueResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String issueCode;
    private IssueType issueType;
    private Long referenceLogId;
    private Long seasonId;
    private Long livestockGroupId;
    private Instant issueDate;
    private BigDecimal totalAmount;
    private String notes;
    private Long issuedByUserId;
    private String issuedByUserName;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private List<IssueItemResponse> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueItemResponse {
        private Long id;
        private Long materialId;
        private String materialSku;
        private String materialName;
        private StandardUnit standardUnit;
        private String batchNumber;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;

        public static IssueItemResponse fromEntity(WarehouseIssueItem entity) {
            if (entity == null) return null;
            return IssueItemResponse.builder()
                    .id(entity.getId())
                    .materialId(entity.getMaterialId())
                    .materialSku(entity.getMaterial() != null ? entity.getMaterial().getSkuCode() : null)
                    .materialName(entity.getMaterial() != null ? entity.getMaterial().getName() : null)
                    .standardUnit(entity.getMaterial() != null ? entity.getMaterial().getStandardUnit() : null)
                    .batchNumber(entity.getBatchNumber())
                    .quantity(entity.getQuantity())
                    .unitPrice(entity.getUnitPrice())
                    .subtotal(entity.getSubtotal())
                    .build();
        }
    }

    public static WarehouseIssueResponse fromEntity(WarehouseIssue entity) {
        if (entity == null) return null;
        List<IssueItemResponse> items = entity.getItems() != null ?
                entity.getItems().stream().map(IssueItemResponse::fromEntity).collect(Collectors.toList()) :
                List.of();

        return WarehouseIssueResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .warehouseId(entity.getWarehouseId())
                .warehouseName(entity.getWarehouse() != null ? entity.getWarehouse().getName() : null)
                .issueCode(entity.getIssueCode())
                .issueType(entity.getIssueType())
                .referenceLogId(entity.getReferenceLogId())
                .seasonId(entity.getSeasonId())
                .livestockGroupId(entity.getLivestockGroupId())
                .issueDate(entity.getIssueDate())
                .totalAmount(entity.getTotalAmount())
                .notes(entity.getNotes())
                .issuedByUserId(entity.getIssuedByUserId())
                .issuedByUserName(entity.getIssuedByUser() != null ? entity.getIssuedByUser().getFullName() : null)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(items)
                .build();
    }
}
