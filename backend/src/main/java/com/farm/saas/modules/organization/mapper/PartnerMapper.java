package com.farm.saas.modules.organization.mapper;

import com.farm.saas.modules.organization.dto.request.PartnerCreateRequest;
import com.farm.saas.modules.organization.dto.request.PartnerUpdateRequest;
import com.farm.saas.modules.organization.dto.response.PartnerResponse;
import com.farm.saas.modules.organization.entity.Partner;
import com.farm.saas.modules.organization.entity.PartnerStatus;

/**
 * Mapper chuyển đổi giữa Partner Entity và Request/Response DTO.
 */
public final class PartnerMapper {

    private PartnerMapper() {
    }

    public static Partner toEntity(PartnerCreateRequest request, Long tenantId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return Partner.builder()
                .tenantId(tenantId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .partnerType(request.getPartnerType())
                .taxCode(request.getTaxCode() != null ? request.getTaxCode().trim() : null)
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .bankAccountInfo(request.getBankAccountInfo() != null ? request.getBankAccountInfo().trim() : null)
                .creditRating(request.getCreditRating() != null && !request.getCreditRating().isBlank() ? request.getCreditRating().trim() : "UNRATED")
                .status(PartnerStatus.ACTIVE)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static void updateEntity(Partner entity, PartnerUpdateRequest request, Long currentUserId) {
        if (entity == null || request == null) {
            return;
        }

        entity.setName(request.getName().trim());
        entity.setPartnerType(request.getPartnerType());
        entity.setTaxCode(request.getTaxCode() != null ? request.getTaxCode().trim() : null);
        entity.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        entity.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        entity.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        entity.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        entity.setBankAccountInfo(request.getBankAccountInfo() != null ? request.getBankAccountInfo().trim() : null);
        if (request.getCreditRating() != null && !request.getCreditRating().isBlank()) {
            entity.setCreditRating(request.getCreditRating().trim());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        entity.setUpdatedBy(currentUserId);
    }

    public static PartnerResponse toResponse(Partner entity) {
        if (entity == null) {
            return null;
        }

        return PartnerResponse.builder()
                .id(entity.getId())
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
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
