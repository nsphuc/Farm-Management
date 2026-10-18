package com.farm.saas.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnterpriseProfileResponse {

    private Long id;
    private Long tenantId;
    private String taxNumber;
    private String legalRepresentative;
    private String headquarterAddress;
    private LocalDate establishedDate;
    private String logoUrl;
    private String contactPhone;
    private String contactEmail;
    private String bankBin;
    private String bankName;
    private String bankAccountNo;
    private String bankAccountName;
    private String certificationsJson;
    private Boolean vietQrSupported;
    private Instant createdAt;
    private Instant updatedAt;
}
