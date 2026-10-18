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
@Table(name = "traceability_snapshots")
public class TraceabilitySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "product_batch_id", nullable = false)
    private Long productBatchId;

    @Column(name = "enterprise_info_json", nullable = false, columnDefinition = "JSON")
    private String enterpriseInfoJson;

    @Column(name = "vietgap_cert_json", columnDefinition = "JSON")
    private String vietgapCertJson;

    @Column(name = "farming_timeline_json", nullable = false, columnDefinition = "JSON")
    private String farmingTimelineJson;

    @Column(name = "harvest_info_json", nullable = false, columnDefinition = "JSON")
    private String harvestInfoJson;

    @Column(name = "qc_inspection_json", columnDefinition = "JSON")
    private String qcInspectionJson;

    @Column(name = "snapshot_hash", length = 128)
    private String snapshotHash;

    @Column(name = "scan_count", nullable = false)
    private Long scanCount;

    @Column(name = "last_scanned_at")
    private Instant lastScannedAt;

    @Column(name = "created_at")
    private Instant createdAt;
}
