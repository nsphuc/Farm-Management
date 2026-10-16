package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.StandardUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO trả về chi tiết dòng hàng trong Phiếu Nhập kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptItemResponse {

    @Schema(description = "ID dòng chi tiết", example = "1")
    private Long id;

    @Schema(description = "ID vật tư", example = "1")
    private Long materialId;

    @Schema(description = "Mã SKU vật tư", example = "SKU-NPK-202015")
    private String materialCode;

    @Schema(description = "Tên vật tư", example = "Phân bón NPK 20-20-15")
    private String materialName;

    @Schema(description = "Đơn vị tính", example = "KG")
    private StandardUnit standardUnit;

    @Schema(description = "Số lô", example = "BATCH-202610-01")
    private String batchNumber;

    @Schema(description = "Hạn sử dụng", example = "2027-10-17")
    private LocalDate expiryDate;

    @Schema(description = "Số lượng nhập", example = "100.00")
    private BigDecimal quantity;

    @Schema(description = "Đơn giá nhập", example = "25000.00")
    private BigDecimal unitPrice;

    @Schema(description = "Thành tiền", example = "2500000.00")
    private BigDecimal totalPrice;

    @Schema(description = "Mã vị trí lưu trữ", example = "KE-A1")
    private String storageBinCode;
}
