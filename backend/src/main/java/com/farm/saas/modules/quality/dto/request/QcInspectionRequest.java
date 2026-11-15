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

/**
 * DTO yêu cầu tạo mới biên bản kiểm định chất lượng KCS cho lô thành phẩm.
 */
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

    /**
     * DTO yêu cầu ghi nhận một chỉ tiêu kiểm định KCS thành phần.
     */
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

        /**
         * Lấy tên chỉ tiêu kiểm định (tương thích alias criterionName).
         *
         * @return Tên chỉ tiêu
         */
        public String getCriterionName() {
            return parameterName;
        }

        /**
         * Thiết lập tên chỉ tiêu kiểm định nếu chưa có giá trị.
         *
         * @param criterionName Tên chỉ tiêu
         */
        public void setCriterionName(String criterionName) {
            if (this.parameterName == null || this.parameterName.isBlank()) {
                this.parameterName = criterionName;
            }
        }

        /**
         * Lấy ngưỡng giá trị tiêu chuẩn (tương thích alias standardValue).
         *
         * @return Ngưỡng tiêu chuẩn
         */
        public String getStandardValue() {
            return standardThreshold;
        }

        /**
         * Thiết lập ngưỡng tiêu chuẩn nếu chưa có giá trị.
         *
         * @param standardValue Ngưỡng tiêu chuẩn
         */
        public void setStandardValue(String standardValue) {
            if (this.standardThreshold == null || this.standardThreshold.isBlank()) {
                this.standardThreshold = standardValue;
            }
        }

        /**
         * Lấy giá trị đo thực tế (tương thích alias actualValue).
         *
         * @return Giá trị đo thực tế
         */
        public String getActualValue() {
            return measuredValue;
        }

        /**
         * Thiết lập giá trị đo thực tế nếu chưa có giá trị.
         *
         * @param actualValue Giá trị thực tế đo được
         */
        public void setActualValue(String actualValue) {
            if (this.measuredValue == null || this.measuredValue.isBlank()) {
                this.measuredValue = actualValue;
            }
        }

        /**
         * Lấy kết quả đánh giá đạt hay không đạt (tương thích alias passed).
         *
         * @return true nếu đạt chuẩn, false nếu không đạt
         */
        public Boolean getPassed() {
            return isPassed;
        }

        /**
         * Thiết lập kết quả đánh giá đạt hay không đạt nếu chưa có giá trị.
         *
         * @param passed Trạng thái đạt/không đạt
         */
        public void setPassed(Boolean passed) {
            if (this.isPassed == null) {
                this.isPassed = passed;
            }
        }
    }
}
