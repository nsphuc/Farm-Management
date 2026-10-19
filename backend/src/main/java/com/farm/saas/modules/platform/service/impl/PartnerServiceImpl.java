package com.farm.saas.modules.platform.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.codegenerator.CodeGenerator;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.platform.dto.request.CreatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerStatusRequest;
import com.farm.saas.modules.platform.dto.response.PartnerResponse;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.platform.service.PartnerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

    private final PartnerRepository partnerRepository;
    private final CodeGenerator codeGenerator;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<PartnerResponse> getPartners(String partnerType, String status, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Page<Partner> page = partnerRepository.searchPartners(tenantId, partnerType, status, keyword, pageable);
        return page.map(this::toPartnerResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerResponse getPartnerById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Partner partner = partnerRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tác", id));
        return toPartnerResponse(partner);
    }

    @Override
    @Transactional
    public PartnerResponse createPartner(CreatePartnerRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase()
                : codeGenerator.generatePartnerCode();

        if (partnerRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("PARTNER_CODE_ALREADY_EXISTS", "Mã đối tác đã tồn tại: " + code);
        }

        Partner partner = Partner.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .partnerType(request.getPartnerType())
                .taxCode(request.getTaxCode())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .contactPerson(request.getContactPerson())
                .bankBin(request.getBankBin())
                .bankName(request.getBankName())
                .bankAccountNo(request.getBankAccountNo())
                .bankAccountName(request.getBankAccountName())
                .bankAccountInfo(request.getNotes())
                .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO)
                .paymentTermDays(request.getPaymentTermDays() != null ? request.getPaymentTermDays() : 0)
                .creditRating(request.getCreditRating() != null ? request.getCreditRating() : "A")
                .status("ACTIVE")
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        partner = partnerRepository.save(partner);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_PARTNER")
                .module("COMMERCIAL")
                .endpoint("/api/v1/partners")
                .method("POST")
                .newValue("Partner: " + partner.getCode() + ", Type: " + partner.getPartnerType())
                .build());

        return toPartnerResponse(partner);
    }

    @Override
    @Transactional
    public PartnerResponse updatePartner(Long id, UpdatePartnerRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Partner partner = partnerRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tác", id));

        partner.setName(request.getName().trim());
        partner.setPartnerType(request.getPartnerType());
        partner.setTaxCode(request.getTaxCode());
        partner.setPhone(request.getPhone());
        partner.setEmail(request.getEmail());
        partner.setAddress(request.getAddress());
        if (request.getContactPerson() != null) partner.setContactPerson(request.getContactPerson());
        if (request.getBankBin() != null) partner.setBankBin(request.getBankBin());
        if (request.getBankName() != null) partner.setBankName(request.getBankName());
        if (request.getBankAccountNo() != null) partner.setBankAccountNo(request.getBankAccountNo());
        if (request.getBankAccountName() != null) partner.setBankAccountName(request.getBankAccountName());
        if (request.getNotes() != null) partner.setBankAccountInfo(request.getNotes());
        if (request.getCreditLimit() != null) partner.setCreditLimit(request.getCreditLimit());
        if (request.getPaymentTermDays() != null) partner.setPaymentTermDays(request.getPaymentTermDays());
        if (request.getCreditRating() != null) partner.setCreditRating(request.getCreditRating());
        partner.setUpdatedBy(SecurityUtils.getCurrentUserId());

        partner = partnerRepository.save(partner);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_PARTNER")
                .module("COMMERCIAL")
                .endpoint("/api/v1/partners/" + id)
                .method("PUT")
                .newValue("Updated partner: " + partner.getCode())
                .build());

        return toPartnerResponse(partner);
    }

    @Override
    @Transactional
    public PartnerResponse updatePartnerStatus(Long id, UpdatePartnerStatusRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Partner partner = partnerRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tác", id));

        String oldStatus = partner.getStatus();
        partner.setStatus(request.getStatus());
        partner.setUpdatedBy(SecurityUtils.getCurrentUserId());
        partner = partnerRepository.save(partner);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_PARTNER_STATUS")
                .module("COMMERCIAL")
                .endpoint("/api/v1/partners/" + id + "/status")
                .method("PATCH")
                .oldValue(oldStatus)
                .newValue(request.getStatus())
                .build());

        return toPartnerResponse(partner);
    }

    private PartnerResponse toPartnerResponse(Partner p) {
        BigDecimal currentDebt = BigDecimal.ZERO;
        try {
            BigDecimal debt = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(remaining_amount), 0.00) FROM debt_records WHERE partner_id = ? AND status IN ('PENDING', 'PARTIAL')",
                    BigDecimal.class, p.getId());
            if (debt != null) currentDebt = debt;
        } catch (Exception ex) {
            log.debug("No debt found for partner {}: {}", p.getId(), ex.getMessage());
        }

        return PartnerResponse.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .code(p.getCode())
                .name(p.getName())
                .partnerType(p.getPartnerType())
                .taxCode(p.getTaxCode())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .contactPerson(p.getContactPerson())
                .bankBin(p.getBankBin())
                .bankName(p.getBankName())
                .bankAccountNo(p.getBankAccountNo())
                .bankAccountName(p.getBankAccountName())
                .creditLimit(p.getCreditLimit())
                .paymentTermDays(p.getPaymentTermDays())
                .creditRating(p.getCreditRating())
                .status(p.getStatus())
                .notes(p.getBankAccountInfo())
                .currentDebt(currentDebt)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
