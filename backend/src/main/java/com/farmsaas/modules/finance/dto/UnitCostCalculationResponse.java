package com.farmsaas.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitCostCalculationResponse {

    private Long farmId;
    private Long seasonId;
    private String seasonCode;
    private String cropTypeName;
    private Long herdId;
    private String herdCode;

    // Chi tiết các khoản chi phí
    private BigDecimal directMaterialCost;   // TRUC_TIEP_VAT_TU
    private BigDecimal directLaborCost;      // TRUC_TIEP_NHAN_CONG
    private BigDecimal machineryCost;        // MAY_MOC
    private BigDecimal depreciationCost;     // KHAU_HAO
    private BigDecimal indirectGeneralCost;  // GIAN_TIEP trực tiếp ghi nhận
    private BigDecimal allocatedOverheadCost;// Chi phí gián tiếp phân bổ từ bảng cost_allocations

    private BigDecimal totalProductionCost;  // Tổng toàn bộ chi phí sản xuất

    // Năng suất & Diện tích
    private BigDecimal plantedAreaM2;
    private BigDecimal actualHarvestYieldKg;
    private BigDecimal estimatedYieldKg;

    // Các chỉ số tính toán giá thành
    private BigDecimal unitCostPerKg;        // Giá thành 1 kg nông sản (VNĐ / kg)
    private BigDecimal costPerM2;            // Suất chi phí trên 1 m2 diện tích (VNĐ / m2)
}
