package com.farmsaas.modules.traceability.entity;

import com.farmsaas.modules.farm.entity.Farm;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "traceability_snapshots", uniqueConstraints = {
    @UniqueConstraint(name = "uk_traceability_snapshots_batch", columnNames = {"product_batch_id"})
})
@EntityListeners(AuditingEntityListener.class)
public class TraceabilitySnapshot implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "product_batch_id", nullable = false)
    private Long productBatchId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_batch_id", insertable = false, updatable = false)
    private ProductBatch productBatch;

    @Column(name = "enterprise_info_json", nullable = false, columnDefinition = "JSON")
    private String enterpriseInfoJson;

    @Column(name = "vietgap_cert_json", columnDefinition = "JSON")
    private String vietgapCertJson;

    @Column(name = "farming_timeline_json", nullable = false, columnDefinition = "JSON")
    private String farmingTimelineJson;

    @Column(name = "harvest_info_json", nullable = false, columnDefinition = "JSON")
    private String harvestInfoJson;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
