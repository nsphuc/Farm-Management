package com.farmsaas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "warehouse_inventory", uniqueConstraints = {
    @UniqueConstraint(name = "uk_warehouse_inventory_item_batch", columnNames = {"warehouse_id", "material_id", "batch_number"})
})
public class WarehouseInventory implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", insertable = false, updatable = false)
    private Material material;

    @Builder.Default
    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber = "DEFAULT";

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Builder.Default
    @Column(name = "quantity_on_hand", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "storage_bin_code", length = 50)
    private String storageBinCode;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public BigDecimal getAvailableQuantity() {
        if (quantityOnHand == null) return BigDecimal.ZERO;
        if (reservedQuantity == null) return quantityOnHand;
        BigDecimal avail = quantityOnHand.subtract(reservedQuantity);
        return avail.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : avail;
    }
}
