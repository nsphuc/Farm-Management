package com.farm.saas.modules.purchase.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "purchase_invoices")
public class PurchaseInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "invoice_type", nullable = false, length = 50)
    private String invoiceType; // FEED_MED, BREED

    @Column(name = "destination_type", nullable = false, length = 50)
    private String destinationType; // WAREHOUSE, BARN

    @Column(name = "destination_name")
    private String destinationName;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "barn_id")
    private Long barnId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "total_goods_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalGoodsAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_payment_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPaymentAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_debt", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingDebt = BigDecimal.ZERO;

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "UNPAID"; // PAID, PARTIAL, UNPAID

    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // BANK_TRANSFER, CASH

    @Column(name = "creator_name", length = 150)
    private String creatorName;

    @Column(name = "approver_name", length = 150)
    private String approverName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseInvoiceItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (totalPaymentAmount == null || totalPaymentAmount.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal goods = totalGoodsAmount != null ? totalGoodsAmount : BigDecimal.ZERO;
            BigDecimal disc = discountAmount != null ? discountAmount : BigDecimal.ZERO;
            totalPaymentAmount = goods.subtract(disc);
        }
        if (paidAmount == null) paidAmount = BigDecimal.ZERO;
        remainingDebt = totalPaymentAmount.subtract(paidAmount);
        if (remainingDebt.compareTo(BigDecimal.ZERO) <= 0) {
            paymentStatus = "PAID";
            remainingDebt = BigDecimal.ZERO;
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = "PARTIAL";
        } else {
            paymentStatus = "UNPAID";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
