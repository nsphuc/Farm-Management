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
@Table(name = "label_print_logs")
public class LabelPrintLog {

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

    @Column(name = "printed_by_user_id")
    private Long printedByUserId;

    @Column(name = "label_size", nullable = false, length = 20)
    private String labelSize;

    @Column(name = "print_quantity", nullable = false)
    private Integer printQuantity;

    @Column(name = "printed_at")
    private Instant printedAt;

    @Column(name = "printer_model", length = 100)
    private String printerModel;
}
