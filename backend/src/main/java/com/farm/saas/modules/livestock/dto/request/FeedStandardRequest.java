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
public class FeedStandardRequest {

    @NotNull(message = "Ngày tuổi bắt đầu không được để trống")
    @Positive(message = "Ngày tuổi bắt đầu phải > 0")
    private Integer dayAgeFrom;

    private Integer dayAgeTo;
    private String stage;
    private String feedType;

    @NotNull(message = "Định mức thức ăn không được để trống")
    private BigDecimal feedAmount; // g hoặc kg

    private String unit; // 'g/con' hoặc 'kg/con'
    private BigDecimal standardWeight; // kg
    private Long materialId;
}
