package com.farm.saas.modules.finance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_allocations")
public class PaymentAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "payment_id", nullable = false)
    private Long paymentId;

    @Column(name = "debt_record_id", nullable = false)
    private Long debtRecordId;

    @Column(name = "allocated_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;
}
