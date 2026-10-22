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
    public Page<PartnerResponse> getPartners(Long farmId, String partnerType, String status, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        com.farm.saas.common.security.CustomUserDetails user = SecurityUtils.getCurrentUser();
        boolean isOwner = user != null && (user.isSuperAdmin() || user.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER"));
        java.util.Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();

        Long effectiveFarmId = farmId;
        boolean isFarmScoped = false;

        if (!isOwner) {
            // Cán bộ cấp Trang trại (FARM_MANAGER, ACCOUNTANT, WAREHOUSE_STAFF có scope_level = 'FARM'):
            // Bắt buộc lọc các đối tác thuộc trang trại của họ (partners.farm_id = :activeFarmId HOẶC đối tác chung toàn chuỗi partners.farm_id IS NULL)!
            if (accessibleFarmIds == null || accessibleFarmIds.isEmpty()) {
                log.warn("FARM scope user {} has no accessible farms. Returning empty page.", SecurityUtils.getCurrentUserId());
                return Page.empty(pageable);
            }

            if (farmId != null && accessibleFarmIds.contains(farmId)) {
                effectiveFarmId = farmId;
            } else {
                effectiveFarmId = accessibleFarmIds.iterator().next();
            }
            isFarmScoped = true;
        }

        Page<Partner> page = partnerRepository.searchPartners(tenantId, effectiveFarmId, isFarmScoped, partnerType, status, keyword, pageable);
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
        com.farm.saas.common.security.CustomUserDetails user = SecurityUtils.getCurrentUser();
        boolean isOwner = user != null && (user.isSuperAdmin() || user.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER"));
        java.util.Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();

        Long targetFarmId = request.getFarmId();
        BigDecimal targetCreditLimit = request.getCreditLimit();

        if (!isOwner) {
            // Cán bộ cấp Trang trại (FARM_MANAGER hoặc Kế toán trại):
            // Tự động gán cứng partner.setFarmId(activeFarmId) và khóa cứng creditLimit = BigDecimal.ZERO (0.00)
            if (request.getFarmId() != null && accessibleFarmIds != null && accessibleFarmIds.contains(request.getFarmId())) {
                targetFarmId = request.getFarmId();
            } else if (accessibleFarmIds != null && !accessibleFarmIds.isEmpty()) {
                targetFarmId = accessibleFarmIds.iterator().next();
            } else {
                throw new BusinessException("FARM_ACCESS_REQUIRED", "Cán bộ cấp trang trại chưa được phân bổ trang trại để tạo đối tác");
            }
            // Khóa cứng creditLimit = 0.00 (muốn tăng hạn mức nợ phải do Owner duyệt!)
            targetCreditLimit = BigDecimal.ZERO;
        } else {
            // Owner: Cho phép chọn farmId (gán cho 1 trại cụ thể hoặc để null dùng chung toàn chuỗi) và được nhập creditLimit
            if (targetCreditLimit == null) {
                targetCreditLimit = BigDecimal.ZERO;
            }
        }

        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase()
                : codeGenerator.generatePartnerCode();

        if (partnerRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("PARTNER_CODE_ALREADY_EXISTS", "Mã đối tác đã tồn tại: " + code);
        }

        Partner partner = Partner.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
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
                .creditLimit(targetCreditLimit)
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
                .newValue("Partner: " + partner.getCode() + ", Type: " + partner.getPartnerType() + ", FarmId: " + partner.getFarmId())
                .build());

        return toPartnerResponse(partner);
    }

    @Override
    @Transactional
    public PartnerResponse updatePartner(Long id, UpdatePartnerRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        com.farm.saas.common.security.CustomUserDetails user = SecurityUtils.getCurrentUser();
        boolean isOwner = user != null && (user.isSuperAdmin() || user.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER"));
        java.util.Set<Long> accessibleFarmIds = SecurityUtils.getCurrentAccessibleFarmIds();

        Partner partner = partnerRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tác", id));

        if (!isOwner) {
            // Cán bộ cấp cơ sở không được chỉnh sửa đối tác của trang trại khác
            if (partner.getFarmId() != null && (accessibleFarmIds == null || !accessibleFarmIds.contains(partner.getFarmId()))) {
                throw new BusinessException("FORBIDDEN_PARTNER_EDIT", "Bạn không có quyền chỉnh sửa đối tác của trang trại khác");
            }
            // Khóa cứng không cho nhân sự cơ sở tự đổi creditLimit
        } else {
            if (request.getFarmId() != null) partner.setFarmId(request.getFarmId());
            if (request.getCreditLimit() != null) partner.setCreditLimit(request.getCreditLimit());
        }

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
        BigDecimal currentReceivableDebt = BigDecimal.ZERO;
        BigDecimal currentPayableDebt = BigDecimal.ZERO;
        try {
            BigDecimal rec = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(remaining_debt), 0.00) FROM debt_records WHERE partner_id = ? AND debt_type = 'RECEIVABLE' AND status != 'PAID'",
                    BigDecimal.class, p.getId());
            if (rec != null) currentReceivableDebt = rec;
        } catch (Exception ex) {
            log.debug("No receivable debt found for partner {}: {}", p.getId(), ex.getMessage());
        }

        try {
            BigDecimal pay = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(remaining_debt), 0.00) FROM debt_records WHERE partner_id = ? AND debt_type = 'PAYABLE' AND status != 'PAID'",
                    BigDecimal.class, p.getId());
            if (pay != null) currentPayableDebt = pay;
        } catch (Exception ex) {
            log.debug("No payable debt found for partner {}: {}", p.getId(), ex.getMessage());
        }

        String farmName = null;
        if (p.getFarm() != null) {
            farmName = p.getFarm().getName();
        } else if (p.getFarmId() != null) {
            try {
                farmName = jdbcTemplate.queryForObject(
                        "SELECT name FROM farms WHERE id = ?", String.class, p.getFarmId());
            } catch (Exception ignored) {}
        }

        return PartnerResponse.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .farmId(p.getFarmId())
                .farmName(farmName)
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
                .currentDebt(currentReceivableDebt.subtract(currentPayableDebt))
                .currentReceivableDebt(currentReceivableDebt)
                .currentPayableDebt(currentPayableDebt)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
