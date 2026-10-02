package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "material_categories", uniqueConstraints = {
    @UniqueConstraint(name = "uk_material_categories_tenant_code", columnNames = {"tenant_id", "code"})
})
public class MaterialCategory extends BaseEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;
}
