package com.farm.saas.modules.quality.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHarvestRecordRequest {

    private String harvestCode;

    @NotNull(message = "Ngày thu hoạch không được để trống")
    private LocalDate harvestDate;

    @NotBlank(message = "Nguồn thu hoạch không được để trống (CROP_SEASON hoặc LIVESTOCK_GROUP)")
    @Pattern(regexp = "CROP_SEASON|LIVESTOCK_GROUP", message = "sourceType phải là CROP_SEASON hoặc LIVESTOCK_GROUP")
    private String sourceType;

    private Long seasonId;

    private Long livestockGroupId;

    @NotNull(message = "Sản lượng thu hoạch không được để trống")
    @DecimalMin(value = "0.01", message = "Sản lượng thu hoạch phải lớn hơn 0")
    private BigDecimal quantity;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @Pattern(regexp = "GRADE_A|GRADE_B|STANDARD|REJECT", message = "qualityGrade phải là GRADE_A, GRADE_B, STANDARD hoặc REJECT")
    private String qualityGrade;

    private Long harvestedByUserId;

    private String notes;
}
