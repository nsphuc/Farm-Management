package com.farm.saas.modules.organization.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.organization.dto.request.PartnerCreateRequest;
import com.farm.saas.modules.organization.dto.request.PartnerUpdateRequest;
import com.farm.saas.modules.organization.dto.response.PartnerResponse;
import com.farm.saas.modules.organization.entity.Partner;
import com.farm.saas.modules.organization.entity.PartnerStatus;
import com.farm.saas.modules.organization.entity.PartnerType;
import com.farm.saas.modules.organization.mapper.PartnerMapper;
import com.farm.saas.modules.organization.repository.PartnerRepository;
import com.farm.saas.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý nghiệp vụ quản lý Đối tác & Chuỗi cung ứng (Partners).
 * Đảm bảo Tenant Isolation: Mọi truy vấn và ghi dữ liệu đều cô lập theo tenant_id của user hiện tại.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerService {

    private static final Logger log = LoggerFactory.getLogger(PartnerService.class);

    private final PartnerRepository partnerRepository;

    /**
     * Lấy danh sách đối tác có phân trang kèm bộ lọc theo loại đối tác và trạng thái.
     * Áp dụng Tenant Isolation để chỉ lấy dữ liệu của Tenant đang đăng nhập.
     */
    public Page<PartnerResponse> getPartners(PartnerType partnerType, PartnerStatus status, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách đối tác cho TenantId: {}, Type: {}, Status: {}", tenantId, partnerType, status);

        Page<Partner> partners;
        if (partnerType != null && status != null) {
            partners = partnerRepository.findAllByTenantIdAndPartnerTypeAndStatus(tenantId, partnerType, status, pageable);
        } else if (partnerType != null) {
            partners = partnerRepository.findAllByTenantIdAndPartnerType(tenantId, partnerType, pageable);
        } else if (status != null) {
            partners = partnerRepository.findAllByTenantIdAndStatus(tenantId, status, pageable);
        } else {
            partners = partnerRepository.findAllByTenantId(tenantId, pageable);
        }

        return partners.map(PartnerMapper::toResponse);
    }

    /**
     * Lấy toàn bộ danh sách đối tác của Tenant (dành cho dropdown/select khi tạo đơn hàng hoặc phiếu nhập kho).
     */
    public List<PartnerResponse> getAllPartners(PartnerType partnerType) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy dropdown đối tác cho TenantId: {}, Type: {}", tenantId, partnerType);

        List<Partner> list;
        if (partnerType != null) {
            list = partnerRepository.findAllByTenantIdAndPartnerTypeAndStatus(tenantId, partnerType, PartnerStatus.ACTIVE);
        } else {
            list = partnerRepository.findAllByTenantId(tenantId);
        }

        return list.stream().map(PartnerMapper::toResponse).toList();
    }

    /**
     * Lấy chi tiết một đối tác theo ID.
     * Kiểm tra tenantId chống IDOR / truy cập chéo tenant.
     */
    public PartnerResponse getPartnerById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Xem chi tiết đối tác ID: {} cho TenantId: {}", id, tenantId);

        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Đối tác", String.valueOf(id)));

        return PartnerMapper.toResponse(partner);
    }

    /**
     * Tạo mới đối tác.
     * - Trích xuất tenantId và userId tự động từ SecurityContext.
     * - Kiểm tra tính duy nhất của mã code trong cùng một Tenant.
     */
    @Transactional
    public PartnerResponse createPartner(PartnerCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        String normalizedCode = request.getCode().trim().toUpperCase();
        log.info("Tạo mới đối tác: Code={}, TenantId={}", normalizedCode, tenantId);

        // Kiểm tra trùng mã đối tác trong cùng một Tenant
        if (partnerRepository.existsByTenantIdAndCode(tenantId, normalizedCode)) {
            throw AppException.conflict("Mã đối tác '" + normalizedCode + "' đã tồn tại trong tổ chức!");
        }

        Partner partner = PartnerMapper.toEntity(request, tenantId, currentUserId);
        Partner saved = partnerRepository.save(partner);
        log.info("Đã tạo đối tác thành công với ID: {}", saved.getId());

        return PartnerMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin đối tác.
     * Giữ nguyên mã code và tenantId để bảo toàn audit trail và liên kết chứng từ.
     */
    @Transactional
    public PartnerResponse updatePartner(Long id, PartnerUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Cập nhật đối tác ID: {}, TenantId: {}", id, tenantId);

        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Đối tác", String.valueOf(id)));

        PartnerMapper.updateEntity(partner, request, currentUserId);
        Partner updated = partnerRepository.save(partner);
        log.info("Cập nhật thành công đối tác ID: {}", id);

        return PartnerMapper.toResponse(updated);
    }

    /**
     * Ngừng hợp tác / vô hiệu hóa đối tác (Soft-delete).
     * Tuyệt đối không xóa vật lý để giữ toàn vẹn dữ liệu cho các chứng từ mua bán, nhập kho đã phát sinh.
     */
    @Transactional
    public void deactivatePartner(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Vô hiệu hóa đối tác ID: {}, TenantId: {}", id, tenantId);

        Partner partner = partnerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Đối tác", String.valueOf(id)));

        partner.setStatus(PartnerStatus.INACTIVE);
        partner.setUpdatedBy(currentUserId);
        partnerRepository.save(partner);
        log.info("Đã vô hiệu hóa thành công đối tác ID: {}", id);
    }
}
