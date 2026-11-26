package com.farm.saas.modules.addons.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hatchery_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HatcheryBatch {

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

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(name = "egg_type", nullable = false, length = 50)
    @Builder.Default
    private String eggType = "CHICKEN"; // CHICKEN, DUCK

    @Column(name = "breed_name", length = 100)
    private String breedName;

    @Column(name = "set_date", nullable = false)
    private LocalDate setDate;

    @Column(name = "total_eggs", nullable = false)
    @Builder.Default
    private Integer totalEggs = 0;

    @Column(name = "fertile_eggs", nullable = false)
    @Builder.Default
    private Integer fertileEggs = 0;

    @Column(name = "expected_hatch_date", nullable = false)
    private LocalDate expectedHatchDate;

    @Column(name = "actual_hatched_count", nullable = false)
    @Builder.Default
    private Integer actualHatchedCount = 0;

    @Column(name = "cull_count", nullable = false)
    @Builder.Default
    private Integer cullCount = 0;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "INCUBATING"; // INCUBATING, HATCHED

    @Column(name = "destination_barn_name", length = 100)
    private String destinationBarnName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
