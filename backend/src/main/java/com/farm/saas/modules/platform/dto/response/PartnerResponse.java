package com.farm.saas.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String code;
    private String name;
    private String partnerType;
    private String taxCode;
    private String phone;
    private String email;
    private String address;
    private BigDecimal creditLimit;
    private Integer paymentTermDays;
    private String creditRating;
    private String status;
    private String contactPerson;
    private String bankBin;
    private String bankName;
    private String bankAccountNo;
    private String bankAccountName;
    private String notes;
    private BigDecimal currentDebt;
    private BigDecimal currentReceivableDebt;
    private BigDecimal currentPayableDebt;
    private Instant createdAt;
    private Instant updatedAt;
}
