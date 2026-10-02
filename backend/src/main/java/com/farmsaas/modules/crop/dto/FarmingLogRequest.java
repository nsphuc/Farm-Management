package com.farmsaas.modules.crop.dto;

import com.farmsaas.modules.crop.entity.enums.ActivityType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmingLogRequest {

    private Instant logDate;

    private String stage;

    @NotNull(message = "Loại hoạt động không được để trống.")
    private ActivityType activityType;

    /**
     * ID kho vật tư lấy dùng (nếu có sử dụng phân bón, thuốc BVTV... để kích hoạt Inventory Backflushing)
     */
    private Long warehouseId;

    @Valid
    private List<SuppliesUsedItem> suppliesUsed;

    private String weatherNotes;

    private String notes;

    private List<String> imageUrls;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuppliesUsedItem {
        @NotNull(message = "Vật tư không được để trống.")
        private Long materialId;

        /**
         * Mã lô (nếu Field Staff quét mã Barcode/QR trên bao bì).
         * Nếu để trống, hệ thống sẽ tự động trừ kho theo FIFO.
         */
        private String batchNumber;

        @NotNull(message = "Số lượng vật tư sử dụng không được để trống.")
        @Positive(message = "Số lượng vật tư sử dụng phải lớn hơn 0.")
        private BigDecimal quantity;

        private String unit;
    }
}
