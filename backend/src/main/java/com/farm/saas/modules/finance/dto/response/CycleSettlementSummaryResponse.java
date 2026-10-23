package com.farm.saas.modules.finance.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleSettlementSummaryResponse {

    private Long cycleId;
    private String cycleName;
    private Long farmId;
    private String farmName;
    private String farmCode;
    private Integer fiscalYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // 'ACTIVE', 'PENDING_SETTLEMENT', 'CLOSED'

    private BigDecimal totalRevenue; // Thu bán hàng
    private BigDecimal totalExpense; // Chi vận hành
    private BigDecimal netProfit;    // Lợi nhuận ròng = totalRevenue - totalExpense

    // Thông tin tài khoản nhận của Owner
    private String ownerBankBin;
    private String ownerBankName;
    private String ownerBankAccountNo;
    private String ownerBankAccountName;
    private String qrTransferContent;
    private String ownerVietQrUrl;

    // Chi tiết bảng kê thu & chi trong chu kỳ
    private Long salesOrderCount;
    private Long expenseCount;
    private List<SettlementRevenueItemDto> recentRevenues;
    private List<SettlementExpenseItemDto> recentExpenses;

    // Thông tin xác nhận kết toán (khi đóng sổ chu kỳ)
    private Instant settledAt;
    private Long settledByUserId;
    private String settledByUserName;
    private String settlementTransactionCode;
    private String settlementProofUrl;
    private String notes;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettlementRevenueItemDto {
        private Long orderId;
        private String orderCode;
        private LocalDate orderDate;
        private String partnerName;
        private BigDecimal finalAmount;
        private BigDecimal paidAmount;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettlementExpenseItemDto {
        private Long expenseId;
        private String expenseCode;
        private LocalDate expenseDate;
        private String categoryName;
        private String expenseSource;
        private BigDecimal amount;
        private String receiptPhotoUrl;
    }
}
