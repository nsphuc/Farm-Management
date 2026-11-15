package com.farm.saas.modules.quality.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO phản hồi chi tiết biên bản kiểm định chất lượng KCS (QC Inspection)
 * kèm danh sách kết quả đo đạc các chỉ tiêu thực tế so với tiêu chuẩn.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QcInspectionDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long productBatchId;
    private String batchCode;
    private String productName;
    private String inspectionCode;
    private LocalDate inspectionDate;
    private Long inspectorUserId;
    private String inspectorName;
    private BigDecimal sampleSize;
    private String sampleUnit;
    private String overallResult;
    private String notes;
    private List<QcInspectionItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * DTO chi tiết kết quả kiểm định một chỉ tiêu chất lượng thành phần.
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QcInspectionItemResponse {
        private Long id;
        private String parameterName;
        private String standardThreshold;
        private String measuredValue;
        private String unit;
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
         * Lấy ngưỡng giá trị tiêu chuẩn (tương thích alias standardValue).
         *
         * @return Ngưỡng tiêu chuẩn
         */
        public String getStandardValue() {
            return standardThreshold;
        }

        /**
         * Lấy giá trị đo thực tế (tương thích alias actualValue).
         *
         * @return Giá trị thực tế đo được
         */
        public String getActualValue() {
            return measuredValue;
        }

        /**
         * Lấy kết quả đánh giá đạt hay không đạt (tương thích alias passed).
         *
         * @return true nếu đạt chuẩn, false nếu không đạt
         */
        public Boolean getPassed() {
            return isPassed;
        }
    }
}
