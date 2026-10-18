package com.farm.saas.modules.quality.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "qc_inspection_items")
public class QcInspectionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;

    @Column(name = "parameter_name", nullable = false, length = 150)
    private String parameterName;

    @Column(name = "standard_threshold", nullable = false, length = 100)
    private String standardThreshold;

    @Column(name = "measured_value", nullable = false, length = 100)
    private String measuredValue;

    @Column(name = "is_passed", nullable = false)
    private Boolean isPassed;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
