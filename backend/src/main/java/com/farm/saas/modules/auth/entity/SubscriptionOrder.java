package com.farm.saas.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscription_orders")
public class SubscriptionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, length = 50, unique = true)
    private String orderCode;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "addon_code", nullable = false, length = 50)
    private String addonCode;

    @Column(name = "package_plan", nullable = false, length = 30)
    @Builder.Default
    private String packagePlan = "MONTHLY";

    @Column(name = "duration_months", nullable = false)
    @Builder.Default
    private Integer durationMonths = 1;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PAID, CANCELLED, FAILED

    @Column(name = "payment_gateway", nullable = false, length = 30)
    @Builder.Default
    private String paymentGateway = "VNPAY"; // VNPAY, MOCK

    @Column(name = "vnp_txn_ref", length = 100)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 100)
    private String vnpTransactionNo;

    @Column(name = "vnp_bank_code", length = 50)
    private String vnpBankCode;

    @Column(name = "vnp_pay_date", length = 30)
    private String vnpPayDate;

    @Column(name = "vnp_response_code", length = 20)
    private String vnpResponseCode;

    @Column(name = "vnp_secure_hash", length = 255)
    private String vnpSecureHash;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = "PENDING";
        if (paymentGateway == null) paymentGateway = "VNPAY";
        if (packagePlan == null) packagePlan = "MONTHLY";
        if (durationMonths == null) durationMonths = 1;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
