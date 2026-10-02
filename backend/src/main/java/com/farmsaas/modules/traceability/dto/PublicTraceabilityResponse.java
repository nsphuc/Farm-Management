package com.farmsaas.modules.traceability.dto;

import com.farmsaas.modules.traceability.entity.enums.QualityGrade;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTraceabilityResponse {

    private String traceabilityCode;
    private String productName;
    private QualityGrade qualityGrade;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private String unit;
    private String qrImageUrl;

    /**
     * Cờ cảnh báo thu hồi khẩn cấp (Zero-Leakage Safety Guard)
     */
    private boolean recalled;
    private String recallReason;

    /**
     * Thông tin tổ chức/trang trại công khai
     */
    private Map<String, Object> enterpriseInfo;

    /**
     * Chứng chỉ VietGAP / GlobalGAP
     */
    private Map<String, Object> vietgapCert;

    /**
     * Thông tin thu hoạch đóng gói
     */
    private Map<String, Object> harvestInfo;

    /**
     * Nhật ký canh tác công khai (Interactive Timeline)
     */
    private List<Map<String, Object>> farmingTimeline;
}
