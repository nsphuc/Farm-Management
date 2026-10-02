package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "warehouse_transfers", uniqueConstraints = {
    @UniqueConstraint(name = "uk_warehouse_transfers_tenant_code", columnNames = {"tenant_id", "transfer_code"})
})
public class WarehouseTransfer extends BaseEntity {

    @Column(name = "transfer_code", nullable = false, length = 50)
    private String transferCode;

    @Column(name = "from_warehouse_id", nullable = false)
    private Long fromWarehouseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_warehouse_id", insertable = false, updatable = false)
    private Warehouse fromWarehouse;

    @Column(name = "to_warehouse_id", nullable = false)
    private Long toWarehouseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_warehouse_id", insertable = false, updatable = false)
    private Warehouse toWarehouse;

    @Column(name = "transfer_date", nullable = false)
    private Instant transferDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private TransferStatus status = TransferStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id", insertable = false, updatable = false)
    private User requestedByUser;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Builder.Default
    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WarehouseTransferItem> items = new ArrayList<>();
}
