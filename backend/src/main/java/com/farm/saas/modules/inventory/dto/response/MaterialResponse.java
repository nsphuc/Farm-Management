package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.DispatchStrategy;
import com.farm.saas.modules.inventory.entity.StandardUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO trả về thông tin chi tiết Mặt hàng / Vật tư nông nghiệp cho Client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialResponse {

    @Schema(description = "ID vật tư", example = "1")
    private Long id;

    @Schema(description = "ID nhóm vật tư", example = "1")
    private Long categoryId;

    @Schema(description = "Mã nhóm vật tư", example = "PHAN_BON")
    private String categoryCode;

    @Schema(description = "Tên nhóm vật tư", example = "Phân bón & Dinh dưỡng cây trồng")
    private String categoryName;

    @Schema(description = "Mã SKU", example = "SKU-NPK-202015")
    private String skuCode;

    @Schema(description = "Tên vật tư", example = "Phân bón NPK Đầu Trâu 20-20-15")
    private String name;

    @Schema(description = "Đơn vị tính chuẩn", example = "KG")
    private StandardUnit standardUnit;

    @Schema(description = "Chiến lược xuất kho: FIFO, FEFO", example = "FIFO")
    private DispatchStrategy dispatchStrategy;

    @Schema(description = "Số ngày cảnh báo hạn sử dụng", example = "30")
    private Integer expiryAlertDays;

    @Schema(description = "Mức tồn kho tối thiểu", example = "50.00")
    private BigDecimal minStockLevel;

    @Schema(description = "Mức tồn kho tối đa", example = "500.00")
    private BigDecimal maxStockLevel;

    @Schema(description = "Đơn giá tiêu chuẩn", example = "25000.00")
    private BigDecimal unitPriceStandard;

    @Schema(description = "Thời điểm khởi tạo bản ghi")
    private Instant createdAt;

    @Schema(description = "Thời điểm cập nhật mới nhất")
    private Instant updatedAt;
}
