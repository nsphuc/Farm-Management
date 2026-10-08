package com.farmsaas.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtAgingReportDto {

    private Long farmId;
    private BigDecimal totalReceivable;       // Tổng phải thu khách hàng
    private BigDecimal totalPayable;          // Tổng phải trả nhà cung cấp

    // Phân loại tuổi nợ phải thu (Receivable Aging Buckets)
    private BigDecimal receivableCurrent;     // Trong hạn
    private BigDecimal receivable1To30;       // Quá hạn 1 - 30 ngày
    private BigDecimal receivable31To60;      // Quá hạn 31 - 60 ngày
    private BigDecimal receivable61To90;      // Quá hạn 61 - 90 ngày
    private BigDecimal receivableOver90;      // Quá hạn > 90 ngày

    // Phân loại tuổi nợ phải trả (Payable Aging Buckets)
    private BigDecimal payableCurrent;
    private BigDecimal payable1To30;
    private BigDecimal payable31To60;
    private BigDecimal payable61To90;
    private BigDecimal payableOver90;

    private List<DebtRecordResponse> records;
}
