package com.farmsaas.modules.enterprise.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.modules.enterprise.dto.EnterpriseRequest;
import com.farmsaas.modules.enterprise.dto.EnterpriseResponse;
import com.farmsaas.modules.enterprise.entity.Enterprise;
import com.farmsaas.modules.enterprise.repository.EnterpriseRepository;
import com.farmsaas.modules.tenant.entity.Tenant;
import com.farmsaas.modules.tenant.repository.TenantRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnterpriseServiceImpl implements EnterpriseService {

    private final EnterpriseRepository enterpriseRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public EnterpriseResponse getMyEnterprise() {
        Long tenantId = getRequiredTenantId();
        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    // Tự động tạo hồ sơ mặc định theo Tenant nếu chưa tồn tại
                    Tenant tenant = tenantRepository.findById(tenantId)
                            .orElseThrow(() -> new BusinessException("Không tìm thấy thông tin Tenant hiện tại."));
                    Enterprise newEnterprise = Enterprise.builder()
                            .name(tenant.getName())
                            .taxNumber("Chưa cập nhật")
                            .legalRepresentative("Chưa cập nhật")
                            .headquarterAddress("Chưa cập nhật")
                            .phone("")
                            .email("")
                            .website("")
                            .logoUrl("")
                            .build();
                    newEnterprise.setTenantId(tenantId);
                    return enterpriseRepository.save(newEnterprise);
                });

        return EnterpriseResponse.fromEntity(enterprise);
    }

    @Override
    @Transactional
    public EnterpriseResponse updateMyEnterprise(EnterpriseRequest request) {
        Long tenantId = getRequiredTenantId();
        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    Enterprise e = new Enterprise();
                    e.setTenantId(tenantId);
                    return e;
                });

        enterprise.setName(request.getName());
        enterprise.setTaxNumber(request.getTaxNumber());
        enterprise.setLegalRepresentative(request.getLegalRepresentative());
        enterprise.setHeadquarterAddress(request.getHeadquarterAddress());
        enterprise.setPhone(request.getPhone());
        enterprise.setEmail(request.getEmail());
        enterprise.setWebsite(request.getWebsite());
        enterprise.setLogoUrl(request.getLogoUrl());
        enterprise.setEstablishedDate(request.getEstablishedDate());
        enterprise.setCertificationsJson(request.getCertificationsJson());

        Enterprise saved = enterpriseRepository.save(enterprise);
        log.info("Updated Enterprise profile for tenantId: {}", tenantId);
        return EnterpriseResponse.fromEntity(saved);
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
