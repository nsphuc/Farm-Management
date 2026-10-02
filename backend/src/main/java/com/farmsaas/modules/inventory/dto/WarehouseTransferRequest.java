package com.farmsaas.modules.inventory.dto;

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
public class WarehouseTransferRequest {

    @Size(max = 50, message = "Mã phiếu điều chuyển tối đa 50 ký tự.")
    private String transferCode;

    @NotNull(message = "Kho xuất không được để trống.")
    private Long fromWarehouseId;

    @NotNull(message = "Kho nhập không được để trống.")
    private Long toWarehouseId;

    private Instant transferDate;
    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng điều chuyển không được để trống.")
    @Valid
    private List<TransferItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferItemRequest {
        @NotNull(message = "Vật tư không được để trống.")
        private Long materialId;

        private String batchNumber;

        @NotNull(message = "Số lượng không được để trống.")
        @Positive(message = "Số lượng điều chuyển phải lớn hơn 0.")
        private BigDecimal quantity;
    }
}
