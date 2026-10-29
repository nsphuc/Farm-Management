package com.farm.saas.modules.quality.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateHarvestRecordRequest {

    private String harvestCode;

    @NotNull(message = "Ngày thu hoạch không được để trống")
    private LocalDate harvestDate;

    @Pattern(regexp = "CROP_SEASON|LIVESTOCK_GROUP", message = "sourceType phải là CROP_SEASON hoặc LIVESTOCK_GROUP")
    private String sourceType;

    @JsonAlias({"cropSeasonId", "seasonId"})
    private Long seasonId;

    @JsonAlias({"groupId", "livestockGroupId"})
    private Long livestockGroupId;

    @NotNull(message = "Sản lượng thu hoạch không được để trống")
    @DecimalMin(value = "0.01", message = "Sản lượng thu hoạch phải lớn hơn 0")
    @JsonAlias({"actualYieldKg", "yieldKg", "harvestQuantity"})
    private BigDecimal quantity;

    private String unit;

    @Pattern(regexp = "GRADE_A|GRADE_B|STANDARD|REJECT|EXPORT", message = "qualityGrade phải là GRADE_A, GRADE_B, STANDARD, REJECT hoặc EXPORT")
    private String qualityGrade;

    private Long harvestedByUserId;

    private Long harvestedByEmployeeId;

    private BigDecimal lossPercentage;

    private String notes;

    public void setQualityGrade(String grade) {
        if ("EXPORT".equalsIgnoreCase(grade)) {
            this.qualityGrade = "GRADE_A";
        } else {
            this.qualityGrade = grade;
        }
    }

    public String getSourceType() {
        if (sourceType != null && !sourceType.isBlank()) {
            return sourceType;
        }
        if (seasonId != null) {
            return "CROP_SEASON";
        }
        if (livestockGroupId != null) {
            return "LIVESTOCK_GROUP";
        }
        return "CROP_SEASON";
    }

    public String getUnit() {
        return (unit != null && !unit.isBlank()) ? unit : "KG";
    }

    public String getQualityGrade() {
        if ("EXPORT".equalsIgnoreCase(qualityGrade)) {
            return "GRADE_A";
        }
        return (qualityGrade != null && !qualityGrade.isBlank()) ? qualityGrade : "STANDARD";
    }
}
