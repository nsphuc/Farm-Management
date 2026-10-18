package com.farm.saas.modules.livestock.entity;

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
@Table(name = "livestock_individuals")
public class LivestockIndividual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "rfid_tag_code", nullable = false, length = 50)
    private String rfidTagCode;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "gender", nullable = false, length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "mother_tag_code", length = 50)
    private String motherTagCode;

    @Column(name = "father_tag_code", length = 50)
    private String fatherTagCode;

    @Column(name = "current_weight_kg", precision = 8, scale = 2)
    private BigDecimal currentWeightKg;

    @Column(name = "health_status", nullable = false, length = 30)
    private String healthStatus;

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
