package com.farm.saas.modules.inventory.entity;

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
@Table(name = "warehouse_issues")
public class WarehouseIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "issue_code", nullable = false, length = 50)
    private String issueCode;

    @Column(name = "issue_type", nullable = false, length = 50)
    private String issueType;

    @Column(name = "receiver_name", length = 150)
    private String receiverName;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "farming_log_id")
    private Long farmingLogId;

    @Column(name = "livestock_event_id")
    private Long livestockEventId;

    @Column(name = "is_backflushed", nullable = false)
    private Boolean isBackflushed;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private Long cancelledBy;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "active_farming_backflush", insertable = false, updatable = false)
    private Long activeFarmingBackflush;

    @Column(name = "active_livestock_backflush", insertable = false, updatable = false)
    private Long activeLivestockBackflush;

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
