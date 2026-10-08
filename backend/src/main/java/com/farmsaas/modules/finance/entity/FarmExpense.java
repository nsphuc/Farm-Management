package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import com.farmsaas.modules.inventory.entity.WarehouseIssue;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.partner.entity.Partner;
import com.farmsaas.modules.user.entity.User;
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
@Table(name = "farm_expenses", uniqueConstraints = {
    @UniqueConstraint(name = "uk_expenses_farm_code", columnNames = {"tenant_id", "farm_id", "expense_code"})
})
public class FarmExpense extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private CostCategory category;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "herd_id")
    private Long herdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "herd_id", insertable = false, updatable = false)
    private LivestockGroup herd;

    @Column(name = "expense_code", nullable = false, length = 50)
    private String expenseCode;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.TIEN_MAT;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "recipient_partner_id")
    private Long recipientPartnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_partner_id", insertable = false, updatable = false)
    private Partner recipientPartner;

    @Column(name = "reference_issue_id")
    private Long referenceIssueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reference_issue_id", insertable = false, updatable = false)
    private WarehouseIssue referenceIssue;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", insertable = false, updatable = false)
    private User createdByUser;
}
