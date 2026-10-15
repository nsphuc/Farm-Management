package com.farm.saas.security.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity đại diện cho bảng users (Người dùng hệ thống Farm SaaS).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId; // NULL chỉ khi is_super_admin = TRUE

    @Column(name = "is_super_admin", nullable = false)
    @Builder.Default
    private Boolean isSuperAdmin = false;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, LOCKED, INACTIVE

    @Column(name = "failed_logins", nullable = false)
    @Builder.Default
    private Integer failedLogins = 0;

    @Column(name = "lock_until")
    private Instant lockUntil;

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

    public boolean isAccountLocked() {
        if ("LOCKED".equalsIgnoreCase(this.status)) {
            return true;
        }
        if (this.lockUntil != null && this.lockUntil.isAfter(Instant.now())) {
            return true;
        }
        return false;
    }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status) && !isAccountLocked();
    }
}
