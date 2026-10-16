package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.StandardUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin chi tiết dòng hàng xuất kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssueItemResponse {

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

    @Schema(description = "Số lượng xuất", example = "20.00")
    private BigDecimal quantity;

    @Schema(description = "Đơn giá xuất", example = "25000.00")
    private BigDecimal unitPrice;

    @Schema(description = "Thành tiền", example = "500000.00")
    private BigDecimal totalPrice;
}
