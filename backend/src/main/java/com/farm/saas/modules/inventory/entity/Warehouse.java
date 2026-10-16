package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity đại diện cho bảng warehouses (Danh mục Kho bãi trong trang trại).
 * Chứa thông tin kho phân bón, thuốc BVTV, thức ăn, nông sản thu hoạch và công cụ.
 * Áp dụng The Farm Barrier Guard: Liên kết chặt chẽ với tenantId và farmId.
 */
@Entity
@Table(name = "warehouses", uniqueConstraints = {
        @UniqueConstraint(name = "uk_warehouses_farm_code", columnNames = {"farm_id", "code"}),
        @UniqueConstraint(name = "uk_warehouses_tenant_farm_id", columnNames = {"tenant_id", "farm_id", "id"}),
        @UniqueConstraint(name = "uk_warehouses_tenant_id", columnNames = {"tenant_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Xác định Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard: Kho bắt buộc trực thuộc một Farm xác định
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Mã kho (duy nhất trong cùng 1 Farm, VD: KHO-PB01, KHO-LMC01)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên kho
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Loại kho: FERTILIZER, PESTICIDE, ANIMAL_FEED, HARVESTED_PRODUCE, TOOLS_EQUIPMENT, GENERAL
    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", nullable = false, length = 50)
    private WarehouseType warehouseType;

    // Mô tả vị trí / khu vực lưu trữ cụ thể trong trang trại
    @Column(name = "location_desc", length = 255)
    private String locationDesc;

    // User ID của thủ kho / người phụ trách quản lý kho
    @Column(name = "manager_user_id")
    private Long managerUserId;

    // Trạng thái kho: ACTIVE, INACTIVE, FULL
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private WarehouseStatus status = WarehouseStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
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
