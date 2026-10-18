package com.farm.saas.modules.quality.dto.request;

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
    @Pattern(regexp = "PENDING|PASSED|REJECTED|CONDITIONAL", message = "overallResult phải là PENDING, PASSED, REJECTED hoặc CONDITIONAL")
    private String overallResult;

    private String notes;

    @NotEmpty(message = "Danh sách chỉ tiêu kiểm định không được để trống")
    @Valid
    private List<QcInspectionItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QcInspectionItemRequest {
        @NotBlank(message = "Tên chỉ tiêu không được để trống")
        private String parameterName;

        @NotBlank(message = "Ngưỡng tiêu chuẩn không được để trống")
        private String standardThreshold;

        @NotBlank(message = "Giá trị đo thực tế không được để trống")
        private String measuredValue;

        @NotNull(message = "Đánh giá đạt/không đạt không được để trống")
        private Boolean isPassed;

        private String notes;
    }
}
