package com.farm.saas.modules.platform.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.platform.dto.request.UpdateEnterpriseProfileRequest;
import com.farm.saas.modules.platform.dto.response.EnterpriseProfileResponse;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.service.EnterpriseProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnterpriseProfileServiceImpl implements EnterpriseProfileService {

    private final EnterpriseRepository enterpriseRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public EnterpriseProfileResponse getProfile() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ doanh nghiệp cho Tenant: " + tenantId));
        return toEnterpriseProfileResponse(enterprise);
    }

    @Override
    @Transactional
    public EnterpriseProfileResponse updateProfile(UpdateEnterpriseProfileRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId)
                .orElseGet(() -> Enterprise.builder().tenantId(tenantId).build());

        enterprise.setTaxNumber(request.getTaxNumber());
        enterprise.setLegalRepresentative(request.getLegalRepresentative());
        enterprise.setHeadquarterAddress(request.getHeadquarterAddress());
        enterprise.setEstablishedDate(request.getEstablishedDate());
        enterprise.setLogoUrl(request.getLogoUrl());
        enterprise.setContactPhone(request.getContactPhone());
        enterprise.setContactEmail(request.getContactEmail());
        enterprise.setBankBin(request.getBankBin());
        enterprise.setBankName(request.getBankName());
        enterprise.setBankAccountNo(request.getBankAccountNo());
        enterprise.setBankAccountName(request.getBankAccountName());
        enterprise.setCertificationsJson(request.getCertificationsJson());

        enterprise = enterpriseRepository.save(enterprise);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_ENTERPRISE_PROFILE")
                .module("PLATFORM")
                .endpoint("/api/v1/enterprise/profile")
                .method("PUT")
                .newValue("Updated enterprise profile for tenant: " + tenantId)
                .build());

        return toEnterpriseProfileResponse(enterprise);
    }

    private EnterpriseProfileResponse toEnterpriseProfileResponse(Enterprise e) {
        boolean vietQrSupported = e.getBankBin() != null && !e.getBankBin().isBlank()
                && e.getBankAccountNo() != null && !e.getBankAccountNo().isBlank();

        return EnterpriseProfileResponse.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .taxNumber(e.getTaxNumber())
                .legalRepresentative(e.getLegalRepresentative())
                .headquarterAddress(e.getHeadquarterAddress())
                .establishedDate(e.getEstablishedDate())
                .logoUrl(e.getLogoUrl())
                .contactPhone(e.getContactPhone())
                .contactEmail(e.getContactEmail())
                .bankBin(e.getBankBin())
                .bankName(e.getBankName())
                .bankAccountNo(e.getBankAccountNo())
                .bankAccountName(e.getBankAccountName())
                .certificationsJson(e.getCertificationsJson())
                .vietQrSupported(vietQrSupported)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
