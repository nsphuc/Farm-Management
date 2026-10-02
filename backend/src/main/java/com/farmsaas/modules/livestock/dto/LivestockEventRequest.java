package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.crop.dto.FarmingLogRequest.SuppliesUsedItem;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockEventRequest {

    @NotNull(message = "Đối tượng sự kiện không được để trống (GROUP hoặc INDIVIDUAL).")
    private TargetType targetType;

    @NotNull(message = "ID đối tượng (đàn hoặc cá thể) không được để trống.")
    private Long targetId;

    @NotNull(message = "Loại sự kiện không được để trống.")
    private LivestockEventType eventType;

    private Instant eventDate;

    /**
     * Chi tiết sự kiện (JSON string): số cân đo được, tên vắc-xin, phác đồ điều trị, mã con giống phối...
     */
    private String detailsJson;

    private Long veterinarianUserId;

    private String notes;

    /**
     * ID kho vật tư xuất dùng thuốc thú y/vắc-xin (nếu có kích hoạt Inventory Backflushing).
     */
    private Long warehouseId;

    @Valid
    private List<SuppliesUsedItem> suppliesUsed;
}
