package com.farm.saas.modules.finance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "payment_code", nullable = false, length = 50)
    private String paymentCode;

    @Column(name = "payment_type", nullable = false, length = 30)
    private String paymentType;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "sales_order_id")
    private Long salesOrderId;

    @Column(name = "warehouse_receipt_id")
    private Long warehouseReceiptId;

    @Column(name = "debt_record_id")
    private Long debtRecordId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "allocated_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Column(name = "reference_code", length = 100)
    private String referenceCode;

    @Column(name = "qr_transfer_content", length = 150)
    private String qrTransferContent;

    @Column(name = "proof_image_url", length = 500)
    private String proofImageUrl;

    @Column(name = "confirmed_by_user_id")
    private Long confirmedByUserId;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at")
    private Instant createdAt;

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
