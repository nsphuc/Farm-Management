package com.farmsaas.modules.traceability.entity;

import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.traceability.entity.enums.LabelSize;
import com.farmsaas.modules.user.entity.User;
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
@Table(name = "label_print_logs", indexes = {
    @Index(name = "idx_print_logs_batch", columnList = "product_batch_id")
})
@EntityListeners(AuditingEntityListener.class)
public class LabelPrintLog implements Serializable {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_batch_id", insertable = false, updatable = false)
    private ProductBatch productBatch;

    @Column(name = "printed_by_user_id", nullable = false)
    private Long printedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "printed_by_user_id", insertable = false, updatable = false)
    private User printedByUser;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "label_size", nullable = false, length = 30)
    private LabelSize labelSize = LabelSize.SIZE_50X50;

    @Builder.Default
    @Column(name = "print_quantity", nullable = false)
    private Integer printQuantity = 1;

    @CreatedDate
    @Column(name = "printed_at", nullable = false, updatable = false)
    private Instant printedAt;

    @Column(name = "printer_model", length = 100)
    private String printerModel;
}
