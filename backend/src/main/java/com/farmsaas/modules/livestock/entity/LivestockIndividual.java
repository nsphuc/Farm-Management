package com.farmsaas.modules.livestock.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "livestock_individuals", uniqueConstraints = {
    @UniqueConstraint(name = "uk_livestock_individuals_rfid", columnNames = {"tenant_id", "rfid_tag_code"})
})
public class LivestockIndividual extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    private ProductionZone zone;

    @Column(name = "rfid_tag_code", nullable = false, length = 50)
    private String rfidTagCode;

    @Column(name = "group_id")
    private Long groupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private LivestockGroup group;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender = Gender.DUC;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "mother_tag_code", length = 50)
    private String motherTagCode;

    @Column(name = "father_tag_code", length = 50)
    private String fatherTagCode;

    @Column(name = "current_weight_kg", precision = 8, scale = 2)
    private BigDecimal currentWeightKg;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "health_status", nullable = false, length = 30)
    private HealthStatus healthStatus = HealthStatus.KHOE_MANH;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
