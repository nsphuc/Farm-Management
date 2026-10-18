package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "warehouse_transfers")
public class WarehouseTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "from_farm_id", nullable = false)
    private Long fromFarmId;

    @Column(name = "to_farm_id", nullable = false)
    private Long toFarmId;

    @Column(name = "from_warehouse_id", nullable = false)
    private Long fromWarehouseId;

    @Column(name = "to_warehouse_id", nullable = false)
    private Long toWarehouseId;

    @Column(name = "transfer_code", nullable = false, length = 50)
    private String transferCode;

    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "transferred_by_user_id")
    private Long transferredByUserId;

    @Column(name = "received_by_user_id")
    private Long receivedByUserId;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "notes", length = 500)
    private String notes;

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
