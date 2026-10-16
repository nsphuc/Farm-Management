package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity đại diện cho bảng warehouse_receipts (Phiếu Nhập kho vật tư).
 * Nghiệp vụ: 3.3. Nhập kho (Inventory Receipts).
 * Áp dụng Tenant Isolation & The Farm Barrier Guard: Liên kết chặt chẽ theo tenant_id và farm_id.
 * Quy tắc bất biến: Không xóa vật lý, chỉ đổi trạng thái sang CANCELLED nếu hủy phiếu.
 */
@Entity
@Table(name = "warehouse_receipts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_warehouse_receipts_code", columnNames = {"tenant_id", "farm_id", "receipt_code"}),
        @UniqueConstraint(name = "uk_warehouse_receipts_tenant_farm_id", columnNames = {"tenant_id", "farm_id", "id"}),
        @UniqueConstraint(name = "uk_warehouse_receipts_tenant_id", columnNames = {"tenant_id", "id"})
}, indexes = {
        @Index(name = "idx_warehouse_receipts_tenant", columnList = "tenant_id"),
        @Index(name = "idx_warehouse_receipts_farm", columnList = "farm_id"),
        @Index(name = "idx_warehouse_receipts_date", columnList = "receipt_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Kho bãi tiếp nhận hàng
    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    // Mã chứng từ phiếu nhập (duy nhất trong cùng Farm và Tenant, VD: PNK-20261017-001)
    @Column(name = "receipt_code", nullable = false, length = 50)
    private String receiptCode;

    // Loại hình nhập kho
    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_type", nullable = false, length = 50)
    private ReceiptType receiptType;

    // Nhà cung cấp / Đối tác giao hàng (bắt buộc cùng Tenant)
    @Column(name = "partner_id")
    private Long partnerId;

    // Ngày hạch toán nhập kho
    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    // Tổng giá trị tiền hàng nhập kho
    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes", length = 500)
    private String notes;

    // Trạng thái phiếu nhập: DRAFT, APPROVED, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ReceiptStatus status = ReceiptStatus.COMPLETED;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private Long cancelledBy;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Version
    @Column(name = "version")
    private Long version;

    // Danh sách dòng chi tiết phiếu nhập kho
    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryReceiptDetail> items = new ArrayList<>();

    public void addItem(InventoryReceiptDetail item) {
        if (items == null) {
            items = new ArrayList<>();
        }
        items.add(item);
        item.setReceipt(this);
    }
}
