package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRangeFeedRequest {

    @NotNull(message = "Từ ngày tuổi không được để trống")
    @Positive
    private Integer fromDay;

    @NotNull(message = "Đến ngày tuổi không được để trống")
    @Positive
    private Integer toDay;

    @Positive
    private Integer stepDays; // Mặc định 1 ngày nếu không truyền hoặc <= 0

    private String stage;
    private String feedType;

    @NotNull(message = "Lượng cám bắt đầu không được để trống")
    private BigDecimal startFeedAmount;

    @NotNull(message = "Lượng cám kết thúc không được để trống")
    private BigDecimal endFeedAmount;

    private String unit; // 'g/con' hoặc 'kg/con'

    private BigDecimal startWeightKg;
    private BigDecimal endWeightKg;
    private Long materialId;
}
