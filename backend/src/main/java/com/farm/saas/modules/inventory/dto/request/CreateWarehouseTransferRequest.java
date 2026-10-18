package com.farm.saas.modules.inventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseTransferRequest {

    private Long toFarmId;

    @NotNull(message = "Kho xuất không được để trống")
    private Long fromWarehouseId;

    @NotNull(message = "Kho nhận không được để trống")
    private Long toWarehouseId;

    @Size(max = 50, message = "Mã phiếu điều chuyển tối đa 50 ký tự")
    private String transferCode;

    @NotNull(message = "Ngày điều chuyển không được để trống")
    private LocalDate transferDate;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String notes;

    @NotEmpty(message = "Danh sách chi tiết điều chuyển không được để trống")
    @Valid
    private List<TransferItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferItemRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotBlank(message = "Số lô nguồn không được để trống")
        private String fromBatchNumber;

        private String toBatchNumber;

        private LocalDate expiryDate;

        @NotNull(message = "Số lượng điều chuyển không được để trống")
        @Positive(message = "Số lượng điều chuyển phải lớn hơn 0")
        private BigDecimal quantity;

        @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
        private BigDecimal unitPrice;

        private BigDecimal totalPrice;

        private String fromBinCode;

        private String toBinCode;
    }
}
