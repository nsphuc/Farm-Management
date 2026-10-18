package com.farm.saas.modules.reports.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtAgingResponse {

    private DebtAgingSummary receivable;
    private DebtAgingSummary payable;
    private List<PartnerDebtAgingDetail> partnerDetails;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebtAgingSummary {
        private BigDecimal currentTerm;
        private BigDecimal overdue1To30;
        private BigDecimal overdue31To60;
        private BigDecimal overdue61To90;
        private BigDecimal overdueOver90;
        private BigDecimal totalDebt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartnerDebtAgingDetail {
        private Long partnerId;
        private String partnerName;
        private String partnerCode;
        private String debtType;
        private BigDecimal currentTerm;
        private BigDecimal overdue1To30;
        private BigDecimal overdue31To60;
        private BigDecimal overdue61To90;
        private BigDecimal overdueOver90;
        private BigDecimal totalDebt;
        private Boolean isBadDebtRisk;
    }
}
