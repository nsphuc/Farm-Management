package com.farmsaas.modules.partner.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.partner.dto.PartnerRequest;
import com.farmsaas.modules.partner.dto.PartnerResponse;
import com.farmsaas.modules.partner.entity.Partner;
import com.farmsaas.modules.partner.repository.PartnerRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

    private final PartnerRepository partnerRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PartnerResponse> getPartners(
            String keyword,
            String partnerType,
            String status,
            String creditRating,
            Pageable pageable
    ) {
        Long tenantId = getRequiredTenantId();
        Page<Partner> page = partnerRepository.searchPartners(
                tenantId,
                keyword,
                partnerType,
                status,
                creditRating,
                pageable
        );

        return PageResponse.of(page.map(PartnerResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerResponse getPartnerById(Long id) {
        Long tenantId = getRequiredTenantId();
        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Đối tác", id));

        return PartnerResponse.fromEntity(partner);
    }

    @Override
    @Transactional
    public PartnerResponse createPartner(PartnerRequest request) {
        Long tenantId = getRequiredTenantId();
        String code = request.getCode().trim().toUpperCase();

        if (partnerRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("Mã đối tác '" + code + "' đã tồn tại.");
        }

        Partner partner = Partner.builder()
                .code(code)
                .name(request.getName().trim())
                .partnerType(request.getPartnerType())
                .taxCode(request.getTaxCode())
                .contactPerson(request.getContactPerson())
                .phone(request.getPhone().trim())
                .email(request.getEmail())
                .address(request.getAddress())
                .bankAccountInfo(request.getBankAccountInfo())
                .creditRating(request.getCreditRating() != null ? request.getCreditRating() : "A")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .notes(request.getNotes())
                .build();
        partner.setTenantId(tenantId);

        Partner saved = partnerRepository.save(partner);
        log.info("Created partner: {} (Code: {}) for tenantId: {}", saved.getName(), saved.getCode(), tenantId);
        return PartnerResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public PartnerResponse updatePartner(Long id, PartnerRequest request) {
        Long tenantId = getRequiredTenantId();
        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Đối tác", id));

        String code = request.getCode().trim().toUpperCase();
        if (partnerRepository.existsByTenantIdAndCodeAndIdNot(tenantId, code, id)) {
            throw new BusinessException("Mã đối tác '" + code + "' đã tồn tại.");
        }

        partner.setCode(code);
        partner.setName(request.getName().trim());
        partner.setPartnerType(request.getPartnerType());
        partner.setTaxCode(request.getTaxCode());
        partner.setContactPerson(request.getContactPerson());
        partner.setPhone(request.getPhone().trim());
        partner.setEmail(request.getEmail());
        partner.setAddress(request.getAddress());
        partner.setBankAccountInfo(request.getBankAccountInfo());
        if (request.getCreditRating() != null) {
            partner.setCreditRating(request.getCreditRating());
        }
        if (request.getStatus() != null) {
            partner.setStatus(request.getStatus());
        }
        partner.setNotes(request.getNotes());

        Partner saved = partnerRepository.save(partner);
        log.info("Updated partner: {} (ID: {})", saved.getName(), id);
        return PartnerResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deletePartner(Long id) {
        Long tenantId = getRequiredTenantId();
        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Đối tác", id));

        partnerRepository.delete(partner);
        log.info("Deleted partner: {} (ID: {})", partner.getName(), id);
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
