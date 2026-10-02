package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.enums.IssueType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseIssueRequest {

    @NotNull(message = "Kho xuất không được để trống.")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu xuất tối đa 50 ký tự.")
    private String issueCode;

    @NotNull(message = "Loại xuất kho không được để trống.")
    private IssueType issueType;

    private Long referenceLogId;
    private Long seasonId;
    private Long livestockGroupId;
    private Instant issueDate;
    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng xuất kho không được để trống.")
    @Valid
    private List<IssueItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueItemRequest {

        @NotNull(message = "Vật tư không được để trống.")
        private Long materialId;

        /**
         * Nếu có batchNumber cụ thể (do quét Barcode/QR): trừ đúng lô.
         * Nếu null hoặc rỗng: hệ thống tự động trừ theo FIFO (lô cận hạn nhất trước).
         */
        private String batchNumber;

        @NotNull(message = "Số lượng xuất không được để trống.")
        @Positive(message = "Số lượng xuất phải lớn hơn 0.")
        private BigDecimal quantity;

        private BigDecimal unitPrice;
    }
}
