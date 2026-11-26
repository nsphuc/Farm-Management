package com.farm.saas.modules.addons.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "feed_production_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedProductionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    @Builder.Default
    private Long tenantId = 1L;

    @Column(name = "farm_id", nullable = false)
    @Builder.Default
    private Long farmId = 1L;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "order_code", nullable = false, length = 50)
    private String orderCode;

    @Column(name = "bom_id", nullable = false)
    private Long bomId;

    @Column(name = "bom_name", nullable = false, length = 150)
    private String bomName;

    @Column(name = "batch_count", nullable = false)
    @Builder.Default
    private Integer batchCount = 1;

    @Column(name = "total_output_kg", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalOutputKg = BigDecimal.ZERO;

    @Column(name = "target_warehouse_id")
    private Long targetWarehouseId;

    @Column(name = "target_warehouse_name", length = 150)
    private String targetWarehouseName;

    @Column(name = "total_material_cost", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalMaterialCost = BigDecimal.ZERO;

    @Column(name = "cost_per_kg", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal costPerKg = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "executed_date", nullable = false)
    private LocalDate executedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
