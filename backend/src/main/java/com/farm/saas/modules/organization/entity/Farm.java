package com.farm.saas.modules.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity đại diện cho bảng farms (Danh mục trang trại trực thuộc Tenant).
 * Chứa thông tin diện tích, loại hình sản xuất, tọa độ địa lý và người quản lý.
 */
@Entity
@Table(name = "farms", uniqueConstraints = {
        @UniqueConstraint(name = "uk_farms_tenant_code", columnNames = {"tenant_id", "code"}),
        @UniqueConstraint(name = "uk_farms_tenant_id", columnNames = {"tenant_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Mỗi trang trại bắt buộc phải thuộc về một Tenant cụ thể
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Mã trang trại (duy nhất trong cùng 1 Tenant)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên trang trại
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    // Loại hình: CROP, LIVESTOCK, MIXED, AQUACULTURE (chk_farms_type)
    @Column(name = "farm_type", nullable = false, length = 50)
    private String farmType;

    // Tổng diện tích (m2), >= 0.00 (chk_farms_area)
    @Column(name = "total_area_m2", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAreaM2 = BigDecimal.ZERO;

    // Tọa độ vĩ độ GPS
    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    // Tọa độ kinh độ GPS
    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    // Địa chỉ hành chính cụ thể
    @Column(name = "address", length = 500)
    private String address;

    // ID người dùng làm quản lý trang trại (User ID)
    @Column(name = "manager_user_id")
    private Long managerUserId;

    // Trạng thái: ACTIVE, INACTIVE, MAINTENANCE (chk_farms_status)
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
