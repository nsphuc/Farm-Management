package com.farm.saas.modules.quality.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QcInspectionRequest {

    @NotNull(message = "Lô thành phẩm không được để trống")
    private Long productBatchId;

    @NotBlank(message = "Mã biên bản KCS không được để trống")
    private String inspectionCode;

    @NotNull(message = "Ngày kiểm định không được để trống")
    private LocalDate inspectionDate;

    @NotNull(message = "Cỡ mẫu kiểm tra không được để trống")
    @DecimalMin(value = "0.01", message = "Cỡ mẫu kiểm tra phải lớn hơn 0")
    private BigDecimal sampleSize;

    @NotBlank(message = "Đơn vị mẫu không được để trống")
    private String sampleUnit;

    @NotBlank(message = "Kết luận kiểm định không được để trống")
    @Pattern(regexp = "PENDING|PASSED|REJECTED|FAILED|CONDITIONAL", message = "overallResult phải là PENDING, PASSED, REJECTED, FAILED hoặc CONDITIONAL")
    private String overallResult;

    @JsonAlias({"photoUrl", "photos", "photo"})
    private String photosJson;

    private String notes;

    @NotEmpty(message = "Danh sách chỉ tiêu kiểm định không được để trống")
    @Valid
    private List<QcInspectionItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QcInspectionItemRequest {
        @NotBlank(message = "Tên chỉ tiêu không được để trống")
        @JsonAlias({"criterionName", "name", "parameterName"})
        private String parameterName;

        @NotBlank(message = "Ngưỡng tiêu chuẩn không được để trống")
        @JsonAlias({"standardValue", "standard", "threshold", "standardThreshold"})
        private String standardThreshold;

        @NotBlank(message = "Giá trị đo thực tế không được để trống")
        @JsonAlias({"actualValue", "actual", "value", "measuredValue"})
        private String measuredValue;

        private String unit;

        @NotNull(message = "Đánh giá đạt/không đạt không được để trống")
        @JsonAlias({"passed", "pass", "isPassed"})
        private Boolean isPassed;

        private String notes;

        public String getCriterionName() {
            return parameterName;
        }

        public void setCriterionName(String criterionName) {
            if (this.parameterName == null || this.parameterName.isBlank()) {
                this.parameterName = criterionName;
            }
        }

        public String getStandardValue() {
            return standardThreshold;
        }

        public void setStandardValue(String standardValue) {
            if (this.standardThreshold == null || this.standardThreshold.isBlank()) {
                this.standardThreshold = standardValue;
            }
        }

        public String getActualValue() {
            return measuredValue;
        }

        public void setActualValue(String actualValue) {
            if (this.measuredValue == null || this.measuredValue.isBlank()) {
                this.measuredValue = actualValue;
            }
        }

        public Boolean getPassed() {
            return isPassed;
        }

        public void setPassed(Boolean passed) {
            if (this.isPassed == null) {
                this.isPassed = passed;
            }
        }
    }
}
