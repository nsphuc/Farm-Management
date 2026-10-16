package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity đại diện cho bảng warehouse_inventory_transactions (Sổ cái Biến động Giao dịch Kho Thống nhất).
 * Single Source of Truth cho biến động kho, kiểm toán bất biến & bảo đảm tính toàn vẹn toán học:
 * (direction = 'IN' => balance_after = balance_before + quantity)
 * (direction = 'OUT' => balance_after = balance_before - quantity)
 * Idempotency Tuyệt đối: uk_inv_trans_item_idempotent (reference_doc_type, reference_item_id, direction).
 */
@Entity
@Table(name = "warehouse_inventory_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_inv_trans_item_idempotent", columnNames = {"reference_doc_type", "reference_item_id", "direction"})
}, indexes = {
        @Index(name = "idx_inv_trans_tenant", columnList = "tenant_id"),
        @Index(name = "idx_inv_trans_farm", columnList = "farm_id"),
        @Index(name = "idx_inv_trans_warehouse_material", columnList = "warehouse_id, material_id, batch_number"),
        @Index(name = "idx_inv_trans_doc", columnList = "reference_doc_type, reference_doc_id"),
        @Index(name = "idx_inv_trans_date", columnList = "transaction_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseInventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_doc_type", nullable = false, length = 50)
    private ReferenceDocType referenceDocType;

    @Column(name = "reference_doc_id", nullable = false)
    private Long referenceDocId;

    @Column(name = "reference_item_id", nullable = false)
    private Long referenceItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private TransactionDirection direction;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "balance_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private Long createdBy;
}
