package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.inventory.entity.enums.IssueType;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "warehouse_issues", uniqueConstraints = {
    @UniqueConstraint(name = "uk_warehouse_issues_tenant_code", columnNames = {"tenant_id", "issue_code"})
})
public class WarehouseIssue extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;

    @Column(name = "issue_code", nullable = false, length = 50)
    private String issueCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 50)
    private IssueType issueType;

    @Column(name = "reference_log_id")
    private Long referenceLogId;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "issue_date", nullable = false)
    private Instant issueDate;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "issued_by_user_id")
    private Long issuedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_user_id", insertable = false, updatable = false)
    private User issuedByUser;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "ISSUED";

    @Builder.Default
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WarehouseIssueItem> items = new ArrayList<>();
}
