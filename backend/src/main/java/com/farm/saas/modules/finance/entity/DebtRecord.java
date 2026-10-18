package com.farm.saas.modules.finance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "debt_records")
public class DebtRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "sales_order_id")
    private Long salesOrderId;

    @Column(name = "warehouse_receipt_id")
    private Long warehouseReceiptId;

    @Column(name = "debt_type", nullable = false, length = 30)
    private String debtType;

    @Column(name = "total_debt", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalDebt;

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "remaining_debt", nullable = false, precision = 14, scale = 2)
    private BigDecimal remainingDebt;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Version
    @Column(name = "version")
    private Long version;
}
