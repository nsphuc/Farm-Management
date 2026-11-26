package com.farm.saas.modules.addons.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "breeding_animals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BreedingAnimal {

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

    @Column(name = "tag_code", nullable = false, length = 50)
    private String tagCode;

    @Column(name = "breed_name", nullable = false, length = 100)
    private String breedName;

    @Column(name = "parity", nullable = false)
    @Builder.Default
    private Integer parity = 1;

    @Column(name = "reproductive_status", nullable = false, length = 50)
    @Builder.Default
    private String reproductiveStatus = "PREGNANT"; // HEIFER, MATING, PREGNANT, LACTATING

    @Column(name = "mating_date")
    private LocalDate matingDate;

    @Column(name = "expected_birth_date")
    private LocalDate expectedBirthDate;

    @Column(name = "actual_birth_date")
    private LocalDate actualBirthDate;

    @Column(name = "born_alive_count", nullable = false)
    @Builder.Default
    private Integer bornAliveCount = 0;

    @Column(name = "weaned_count", nullable = false)
    @Builder.Default
    private Integer weanedCount = 0;

    @Column(name = "barn_name", length = 100)
    private String barnName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
