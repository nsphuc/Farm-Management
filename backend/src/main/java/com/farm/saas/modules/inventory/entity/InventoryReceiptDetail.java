package com.farm.saas.modules.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity đại diện cho bảng warehouse_receipt_items (Chi tiết dòng hàng trong Phiếu Nhập kho).
 * Lưu thông tin vật tư, số lô, hạn dùng, số lượng và đơn giá nhập.
 */
@Entity
@Table(name = "warehouse_receipt_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_receipt_items_batch", columnNames = {"receipt_id", "material_id", "batch_number"})
}, indexes = {
        @Index(name = "idx_receipt_items_receipt", columnList = "receipt_id"),
        @Index(name = "idx_receipt_items_material", columnList = "material_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    @JsonIgnore
    private InventoryReceipt receipt;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Mặt hàng vật tư nhập kho
    @Column(name = "material_id", nullable = false)
    private Long materialId;

    // Số lô sản xuất / nhập kho
    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    // Hạn sử dụng của lô
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    // Số lượng nhập kho
    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    // Đơn giá nhập
    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    // Thành tiền = quantity * unit_price
    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    // Vị trí lưu trữ trong kho (kệ / ngăn)
    @Column(name = "storage_bin_code", length = 50)
    private String storageBinCode;

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
}
