package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity đại diện cho bảng material_categories (Danh mục Nhóm vật tư nông nghiệp).
 * Ví dụ: Giống cây trồng, Phân bón vô cơ, Thuốc trừ sâu sinh học, Thức ăn tinh,...
 * Áp dụng Tenant Isolation: Nhóm vật tư thuộc về Tenant sở hữu.
 */
@Entity
@Table(name = "material_categories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_material_categories_code", columnNames = {"tenant_id", "code"}),
        @UniqueConstraint(name = "uk_material_categories_tenant_id", columnNames = {"tenant_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Xác định Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Mã nhóm vật tư (duy nhất trong Tenant, VD: PHAN_BON, THUOC_BVTV, GIONG, THUC_AN)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên nhóm vật tư
    @Column(name = "name", nullable = false, length = 150)
    private String name;

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
