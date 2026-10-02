package com.farmsaas.modules.traceability.dto;

import com.farmsaas.modules.traceability.entity.enums.QualityGrade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestBatchRequest {

    private Long seasonId;

    private Long livestockGroupId;

    @Size(max = 50, message = "Mã lô tối đa 50 ký tự.")
    private String batchCode; // nếu null, hệ thống tự sinh LO-yyyyMMdd-XXXX

    @NotBlank(message = "Tên nông sản thành phẩm không được để trống.")
    @Size(max = 255, message = "Tên nông sản tối đa 255 ký tự.")
    private String productName;

    @NotNull(message = "Ngày thu hoạch không được để trống.")
    private LocalDate harvestDate;

    private LocalDate expiryDate;

    @NotNull(message = "Sản lượng đóng gói ban đầu không được để trống.")
    @Positive(message = "Sản lượng phải lớn hơn 0.")
    private BigDecimal initialQuantity;

    @Builder.Default
    private String unit = "KG";

    @Builder.Default
    private QualityGrade qualityGrade = QualityGrade.LOAI_1;

    /**
     * ID kho thành phẩm lưu trữ (nếu có, tự động tạo phiếu nhập kho thành phẩm).
     */
    private Long warehouseId;
}
