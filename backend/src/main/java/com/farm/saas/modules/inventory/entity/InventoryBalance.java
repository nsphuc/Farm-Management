package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity đại diện cho bảng warehouse_inventory (Theo dõi tồn kho thực tế theo từng Kho, Mặt hàng và Số lô).
 * Nghiệp vụ: 3.7. Theo dõi tồn kho hiện tại (Inventory Balance).
 * Hỗ trợ chiến lược xuất kho FIFO (theo inwardDate) và FEFO (theo expiryDate).
 * Tích hợp Optimistic Locking (@Version) chống xung đột cập nhật đồng thời (Race Condition).
 */
@Entity
@Table(name = "warehouse_inventory", uniqueConstraints = {
        @UniqueConstraint(name = "uk_warehouse_inventory_batch", columnNames = {"warehouse_id", "material_id", "batch_number"})
}, indexes = {
        @Index(name = "idx_warehouse_inventory_tenant", columnList = "tenant_id"),
        @Index(name = "idx_warehouse_inventory_farm", columnList = "farm_id"),
        @Index(name = "idx_warehouse_inventory_warehouse", columnList = "warehouse_id"),
        @Index(name = "idx_warehouse_inventory_material", columnList = "material_id"),
        @Index(name = "idx_warehouse_inventory_fifo", columnList = "material_id, inward_date, expiry_date"),
        @Index(name = "idx_warehouse_inventory_fefo", columnList = "material_id, expiry_date, inward_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBalance {

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

    // Mã số lô nhập kho (Batch / Lot Number)
    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    // Ngày nhập kho phục vụ chiến lược FIFO
    @Column(name = "inward_date", nullable = false)
    private LocalDate inwardDate;

    // Hạn sử dụng phục vụ chiến lược FEFO
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    // Đơn giá vốn thực tế bình quân của lô
    @Column(name = "unit_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    // Số lượng tồn kho thực tế khả dụng trên thẻ kho
    @Column(name = "quantity_on_hand", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    // Số lượng đang được giữ chỗ / đặt trước
    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    // Mã vị trí / kệ / ngăn lưu trữ trong kho (Storage Bin / Rack / Shelf)
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

    // Optimistic Locking chống xung đột ghi đè đồng thời
    @Version
    @Column(name = "version")
    private Long version;
}
