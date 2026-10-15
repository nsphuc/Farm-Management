package com.farm.saas.modules.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity đại diện cho bảng zone_locations (Vị trí chi tiết trong phân khu: Luống rau, Ô đất nhỏ, Dãy chuồng).
 * Thuộc cấu trúc phân cấp nghiêm ngặt: Tenant -> Farm -> ProductionZone -> ZoneLocation.
 */
@Entity
@Table(name = "zone_locations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_zone_locations_zone_code", columnNames = {"zone_id", "code"}),
        @UniqueConstraint(name = "uk_zone_locations_composite_id", columnNames = {"tenant_id", "farm_id", "zone_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard: Farm scope
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Phân khu cha trực tiếp (Foreign Key tới production_zones)
    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    // Mã vị trí (duy nhất trong cùng 1 Phân khu)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên vị trí chi tiết
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Mô tả chi tiết (ví dụ: luống số 1, dãy chuồng A, bể nuôi số 2)
    @Column(name = "description", length = 500)
    private String description;

    // Trạng thái: ACTIVE, OCCUPIED, EMPTY, MAINTENANCE (chk_zone_locations_status)
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
