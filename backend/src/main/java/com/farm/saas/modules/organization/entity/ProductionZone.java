package com.farm.saas.modules.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity đại diện cho bảng production_zones (Phân khu sản xuất: Nhà màng, Nhà kính, Đồng ruộng, Chuồng trại).
 * Thuộc về một Farm và Tenant xác định, áp dụng The Farm Barrier Guard.
 */
@Entity
@Table(name = "production_zones", uniqueConstraints = {
        @UniqueConstraint(name = "uk_production_zones_farm_code", columnNames = {"farm_id", "code"}),
        @UniqueConstraint(name = "uk_production_zones_tenant_farm_id", columnNames = {"tenant_id", "farm_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Xác định Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard: Liên kết chặt chẽ với trang trại sở tại
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Mã phân khu (duy nhất trong cùng 1 Farm)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên phân khu sản xuất
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    // Loại phân khu: GREENHOUSE, OPEN_FIELD, BARN, POND, STORAGE, ISOLATION (chk_production_zones_type)
    @Column(name = "zone_type", nullable = false, length = 50)
    private String zoneType;

    // Diện tích phân khu (m2), >= 0.00 (chk_production_zones_area)
    @Column(name = "area_m2", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal areaM2 = BigDecimal.ZERO;

    // Đặc tính loại đất
    @Column(name = "soil_type", length = 100)
    private String soilType;

    // Nguồn cấp nước tưới tiêu / sinh hoạt
    @Column(name = "water_source", length = 100)
    private String waterSource;

    // Trạng thái: ACTIVE, FALLOW, QUARANTINE, MAINTENANCE (chk_production_zones_status)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

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
