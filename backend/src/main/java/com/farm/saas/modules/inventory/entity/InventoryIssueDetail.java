package com.farm.saas.modules.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity đại diện cho bảng warehouse_issue_items (Chi tiết dòng hàng trong Phiếu Xuất kho).
 * Lưu thông tin vật tư, số lô xuất, số lượng và đơn giá xuất kho.
 */
@Entity
@Table(name = "warehouse_issue_items", indexes = {
        @Index(name = "idx_issue_items_issue", columnList = "issue_id"),
        @Index(name = "idx_issue_items_material", columnList = "material_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssueDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    @JsonIgnore
    private InventoryIssue issue;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Mặt hàng vật tư xuất kho
    @Column(name = "material_id", nullable = false)
    private Long materialId;

    // Số lô hàng được xuất
    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    // Số lượng xuất kho
    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    // Đơn giá xuất kho
    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    // Thành tiền = quantity * unit_price
    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

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
