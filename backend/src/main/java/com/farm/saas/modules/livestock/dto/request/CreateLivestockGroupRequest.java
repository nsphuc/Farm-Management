package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.*;
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
public class CreateLivestockGroupRequest {

    @NotNull(message = "Khu sản xuất không được để trống")
    private Long zoneId;

    private Long locationId;

    private Long operationalCycleId;

    @Size(max = 50, message = "Mã đàn tối đa 50 ký tự")
    private String groupCode;

    @NotNull(message = "Giống vật nuôi không được để trống")
    private Long breedId;

    private Long partnerId;

    @NotNull(message = "Số lượng ban đầu không được để trống")
    @Min(value = 1, message = "Số lượng ban đầu phải lớn hơn 0")
    private Integer initialQuantity;

    private BigDecimal unitPrice;

    private BigDecimal totalCost;

    private BigDecimal avgInitialWeightKg;

    private String healthCertificate;

    private String origin;

    private String notes;

    @NotNull(message = "Ngày nhập đàn không được để trống")
    private LocalDate entryDate;

    private String managementType; // 'FLOCK_HERD' | 'INDIVIDUAL_TAGGED'
}
