package com.farm.saas.modules.quality.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO phản hồi chi tiết thông tin biên bản thu hoạch nông sản hoặc xuất chuồng vật nuôi.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestRecordDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private String harvestCode;
    private LocalDate harvestDate;
    private String sourceType;
    private Long seasonId;
    private String seasonCode;
    private String cropTypeName;
    private Long livestockGroupId;
    private String groupCode;
    private BigDecimal quantity;
    private String unit;
    private String qualityGrade;
    private Long harvestedByUserId;
    private String harvestedByName;
    private String notes;
    private Long productBatchId;
    private String productBatchCode;
    private BigDecimal lossPercentage;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Lấy sản lượng thu hoạch thực tế (tương thích thuộc tính actualYieldKg trên giao diện).
     *
     * @return Sản lượng thu hoạch
     */
    public BigDecimal getActualYieldKg() {
        return quantity;
    }
}
