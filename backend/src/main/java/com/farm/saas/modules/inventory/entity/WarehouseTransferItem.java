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
@Table(name = "warehouse_transfer_items")
public class WarehouseTransferItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "transfer_id", nullable = false)
    private Long transferId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "from_batch_number", nullable = false, length = 50)
    private String fromBatchNumber;

    @Column(name = "to_batch_number", nullable = false, length = 50)
    private String toBatchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "from_bin_code", length = 50)
    private String fromBinCode;

    @Column(name = "to_bin_code", length = 50)
    private String toBinCode;

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
