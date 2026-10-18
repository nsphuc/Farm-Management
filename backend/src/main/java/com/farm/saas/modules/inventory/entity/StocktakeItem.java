package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stocktake_items")
public class StocktakeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "stocktake_id", nullable = false)
    private Long stocktakeId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Column(name = "book_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal bookQuantity;

    @Column(name = "actual_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualQuantity;

    @Column(name = "difference_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal differenceQuantity;

    @Column(name = "reason", length = 255)
    private String reason;

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
