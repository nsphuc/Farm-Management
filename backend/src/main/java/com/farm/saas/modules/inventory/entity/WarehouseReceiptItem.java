package com.farm.saas.modules.inventory.entity;

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
@Table(name = "warehouse_receipt_items")
public class WarehouseReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "receipt_id", nullable = false)
    private Long receiptId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "entered_unit", length = 30)
    private String enteredUnit;

    @Column(name = "entered_quantity", precision = 12, scale = 2)
    private BigDecimal enteredQuantity;

    @Column(name = "conversion_factor", nullable = false, precision = 12, scale = 4)
    private BigDecimal conversionFactor;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "storage_bin_code", length = 50)
    private String storageBinCode;

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
