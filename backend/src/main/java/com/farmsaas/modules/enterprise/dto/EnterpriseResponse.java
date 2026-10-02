package com.farmsaas.modules.enterprise.dto;

import com.farmsaas.modules.enterprise.entity.Enterprise;
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
public class EnterpriseResponse {

    private Long id;
    private Long tenantId;
    private String name;
    private String taxNumber;
    private String legalRepresentative;
    private String headquarterAddress;
    private String phone;
    private String email;
    private String website;
    private String logoUrl;
    private LocalDate establishedDate;
    private String certificationsJson;
    private Instant createdAt;
    private Instant updatedAt;

    public static EnterpriseResponse fromEntity(Enterprise entity) {
        if (entity == null) {
            return null;
        }
        return EnterpriseResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .taxNumber(entity.getTaxNumber())
                .legalRepresentative(entity.getLegalRepresentative())
                .headquarterAddress(entity.getHeadquarterAddress())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .website(entity.getWebsite())
                .logoUrl(entity.getLogoUrl())
                .establishedDate(entity.getEstablishedDate())
                .certificationsJson(entity.getCertificationsJson())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
