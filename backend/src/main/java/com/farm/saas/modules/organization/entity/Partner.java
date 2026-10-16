package com.farm.saas.modules.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity đại diện cho bảng partners (Đối tác: Nhà cung cấp, Khách hàng, Đơn vị vận chuyển, Đại lý).
 * Áp dụng Tenant Isolation: Mỗi đối tác gắn liền với một Tenant sở hữu.
 */
@Entity
@Table(name = "partners", uniqueConstraints = {
        @UniqueConstraint(name = "uk_partners_tenant_code", columnNames = {"tenant_id", "code"}),
        @UniqueConstraint(name = "uk_partners_tenant_id", columnNames = {"tenant_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Cô lập đối tác theo Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Mã đối tác (duy nhất trong cùng 1 Tenant, VD: NCC-001, KH-002)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    // Tên đối tác (Tên công ty hoặc tên cá nhân)
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    // Phân loại: SUPPLIER, BUYER, LOGISTICS, AGENT
    @Enumerated(EnumType.STRING)
    @Column(name = "partner_type", nullable = false, length = 50)
    private PartnerType partnerType;

    // Mã số thuế doanh nghiệp
    @Column(name = "tax_code", length = 50)
    private String taxCode;

    // Người đại diện liên hệ
    @Column(name = "contact_person", length = 150)
    private String contactPerson;

    // Số điện thoại liên hệ
    @Column(name = "phone", length = 30)
    private String phone;

    // Email liên hệ
    @Column(name = "email", length = 100)
    private String email;

    // Địa chỉ văn phòng / kho bãi
    @Column(name = "address", length = 500)
    private String address;

    // Thông tin tài khoản ngân hàng (Số TK, Ngân hàng, Chi nhánh)
    @Column(name = "bank_account_info", length = 255)
    private String bankAccountInfo;

    // Xếp hạng tín dụng nội bộ: A, B, C, UNRATED
    @Column(name = "credit_rating", length = 30)
    @Builder.Default
    private String creditRating = "UNRATED";

    // Trạng thái: ACTIVE, INACTIVE, BLACKLISTED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PartnerStatus status = PartnerStatus.ACTIVE;

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
