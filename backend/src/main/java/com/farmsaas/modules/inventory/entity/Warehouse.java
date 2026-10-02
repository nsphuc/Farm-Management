package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.inventory.entity.enums.WarehouseType;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "warehouses", uniqueConstraints = {
    @UniqueConstraint(name = "uk_warehouses_farm_code", columnNames = {"tenant_id", "farm_id", "code"})
})
public class Warehouse extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", nullable = false, length = 50)
    private WarehouseType warehouseType;

    @Column(name = "location_desc", length = 500)
    private String locationDesc;

    @Column(name = "manager_user_id")
    private Long managerUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_user_id", insertable = false, updatable = false)
    private User manager;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";
}
