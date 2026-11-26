package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class AddBatchGroupRequest {

    private Long breedId;

    @NotNull(message = "Số lượng nhập không được để trống")
    @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
    private Integer quantity;

    private BigDecimal avgWeightKg;

    private String gender; // MALE, FEMALE, MIXED

    private String sourceType; // PURCHASE, INTERNAL

    private LocalDate entryDate;

    private BigDecimal costPrice;

    private String healthCertificate;

    private String origin;

    private String notes;
}
