package com.farm.saas.modules.quality.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO phản hồi thông tin truy xuất nguồn gốc công khai phục vụ người tiêu dùng quét mã QR.
 * Bao gồm các thông tin lô hàng, trạng thái thu hồi, số lượt quét, doanh nghiệp, chứng chỉ VietGAP,
 * dòng thời gian canh tác, biên bản thu hoạch và kết quả kiểm định KCS.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTraceabilityResponse {
    private String traceabilityCode;
    private String productName;
    private String productImageUrl;
    private String qualityGrade;
    private String batchCode;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private String storageConditions;
    private String batchStatus;
    @JsonProperty("isRecalled")
    private boolean isRecalled;
    private String recallReason;
    private Instant recalledAt;
    private Long scanCount;
    private Instant lastScannedAt;

    private Object enterprise;
    private Object certifications;
    private Object farmingTimeline;
    private Object harvestInfo;
    private Object qcInspection;
}
