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
@Table(name = "farm_expenses")
public class FarmExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "cost_category_id", nullable = false)
    private Long costCategoryId;

    @Column(name = "expense_code", nullable = false, length = 50)
    private String expenseCode;

    @Column(name = "expense_source", nullable = false, length = 50)
    private String expenseSource;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "unit_cost_eligible", nullable = false)
    private Boolean unitCostEligible;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;

    @Column(name = "receipt_photo_url", length = 500)
    private String receiptPhotoUrl;

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
