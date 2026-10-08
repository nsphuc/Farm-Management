package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import com.farmsaas.modules.partner.entity.Partner;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "debt_records")
public class DebtRecord extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", insertable = false, updatable = false)
    private Partner partner;

    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private SalesOrder order;

    @Enumerated(EnumType.STRING)
    @Column(name = "debt_type", nullable = false, length = 50)
    private DebtType debtType;

    @Column(name = "original_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private DebtStatus status = DebtStatus.TRONG_HAN;

    @Column(name = "notes")
    private String notes;
}
