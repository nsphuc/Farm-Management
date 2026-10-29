package com.farm.saas.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseIssueDetailResponse {
    private Long id;
    private Long farmId;
    private Long warehouseId;
    private String warehouseName;
    private String issueCode;
    private String issueType;
    private String receiverName;
    private Long seasonId;
    private Long livestockGroupId;
    private Long farmingLogId;
    private Long livestockEventId;
    private Boolean isBackflushed;
    private LocalDate issueDate;
    private BigDecimal totalAmount;
    private String notes;
    private String status;
    private Long approvedBy;
    private Instant approvedAt;
    private Long cancelledBy;
    private Instant cancelledAt;
    private String cancellationReason;
    private List<IssueItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueItemDto {
        private Long id;
        private Long materialId;
        private String skuCode;
        private String materialName;
        private String standardUnit;
        private String batchNumber;
        private String enteredUnit;
        private BigDecimal enteredQuantity;
        private BigDecimal conversionFactor;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
