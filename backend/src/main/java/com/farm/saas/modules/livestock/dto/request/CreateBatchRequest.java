package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBatchRequest {

    @NotNull(message = "Chuồng nuôi không được để trống")
    private Long barnId;

    private String code;

    @NotNull(message = "Giống / Quy trình nuôi không được để trống")
    private Long breedId;

    @NotNull(message = "Số lượng nhập đàn không được để trống")
    @Positive(message = "Số lượng con giống phải > 0")
    private Integer initialQuantity;

    @NotNull(message = "Ngày nhập đàn không được để trống")
    private LocalDate entryDate;

    private BigDecimal avgInitialWeightKg;
    private BigDecimal unitPrice;
    private Long partnerId;
    private String notes;
}
