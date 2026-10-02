package com.farmsaas.modules.partner.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.*;

/**
 * Partner Entity representing Suppliers, Distributors, Transporters.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "partners", uniqueConstraints = {
        @UniqueConstraint(name = "uk_partners_tenant_code", columnNames = { "tenant_id", "code" })
})
public class Partner extends BaseEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    /**
     * SUPPLIER (Nhà cung cấp), DISTRIBUTOR (Đại lý thu mua), TRANSPORTER (Đơn vị vận chuyển)
     */
    @Column(name = "partner_type", nullable = false, length = 50)
    private String partnerType;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "bank_account_info")
    private String bankAccountInfo;

    /**
     * A, B, C, D
     */
    @Column(name = "credit_rating", nullable = false, length = 10)
    @Builder.Default
    private String creditRating = "A";

    /**
     * ACTIVE, INACTIVE
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
