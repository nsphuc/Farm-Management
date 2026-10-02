package com.farmsaas.modules.partner.dto;

import com.farmsaas.modules.partner.entity.Partner;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String partnerType;
    private String taxCode;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String bankAccountInfo;
    private String creditRating;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static PartnerResponse fromEntity(Partner entity) {
        if (entity == null) return null;
        return PartnerResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .code(entity.getCode())
                .name(entity.getName())
                .partnerType(entity.getPartnerType())
                .taxCode(entity.getTaxCode())
                .contactPerson(entity.getContactPerson())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .bankAccountInfo(entity.getBankAccountInfo())
                .creditRating(entity.getCreditRating())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
