package com.farm.saas.modules.finance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "farm_financial_settings")
public class FarmFinancialSetting {

    @Id
    @Column(name = "farm_id")
    private Long farmId;

    @Column(name = "bank_bin", length = 20)
    @Builder.Default
    private String bankBin = "970436";

    @Column(name = "bank_name", length = 100)
    @Builder.Default
    private String bankName = "Vietcombank";

    @Column(name = "bank_account_no", length = 50)
    @Builder.Default
    private String bankAccountNo = "1026790945";

    @Column(name = "bank_account_name", length = 150)
    @Builder.Default
    private String bankAccountName = "NGUYEN SI PHUC";

    @Column(name = "default_expense_reasons", columnDefinition = "TEXT")
    private String defaultExpenseReasons;

    @Column(name = "default_income_reasons", columnDefinition = "TEXT")
    private String defaultIncomeReasons;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
