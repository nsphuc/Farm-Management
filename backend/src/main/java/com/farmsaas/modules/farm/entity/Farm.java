package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Farm Entity representing an agricultural facility.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "farms", uniqueConstraints = {
        @UniqueConstraint(name = "uk_farms_tenant_code", columnNames = { "tenant_id", "code" })
})
public class Farm extends BaseEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    /**
     * TRONG_TROT (Trồng trọt), CHAN_NUOI (Chăn nuôi), HON_HOP (Hỗn hợp)
     */
    @Column(name = "farm_type", nullable = false, length = 50)
    private String farmType;

    @Column(name = "total_area_m2", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAreaM2 = BigDecimal.ZERO;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "manager_user_id")
    private Long managerUserId;

    /**
     * ACTIVE, INACTIVE, MAINTENANCE
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_user_id", insertable = false, updatable = false)
    private User manager;
}
