package com.farm.saas.modules.organization.repository;

import com.farm.saas.modules.organization.entity.Partner;
import com.farm.saas.modules.organization.entity.PartnerStatus;
import com.farm.saas.modules.organization.entity.PartnerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng partners.
 * Tuân thủ nguyên tắc Tenant Isolation: Mọi truy vấn bắt buộc phải kèm tenant_id.
 */
@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    // Lấy chi tiết đối tác kèm Tenant Isolation
    Optional<Partner> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra tồn tại đối tác trong Tenant
    boolean existsByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra mã đối tác duy nhất trong cùng 1 Tenant
    boolean existsByTenantIdAndCode(Long tenantId, String code);

    // Kiểm tra trùng mã code khi cập nhật đối tác khác
    boolean existsByTenantIdAndCodeAndIdNot(Long tenantId, String code, Long id);

    // Phân trang danh sách đối tác theo Tenant
    Page<Partner> findAllByTenantId(Long tenantId, Pageable pageable);

    // Phân trang theo Tenant và Loại đối tác
    Page<Partner> findAllByTenantIdAndPartnerType(Long tenantId, PartnerType partnerType, Pageable pageable);

    // Phân trang theo Tenant và Trạng thái
    Page<Partner> findAllByTenantIdAndStatus(Long tenantId, PartnerStatus status, Pageable pageable);

    // Phân trang theo Tenant, Loại đối tác và Trạng thái
    Page<Partner> findAllByTenantIdAndPartnerTypeAndStatus(Long tenantId, PartnerType partnerType, PartnerStatus status, Pageable pageable);

    // Lấy toàn bộ danh sách đối tác của Tenant (dùng cho Dropdown/Select)
    List<Partner> findAllByTenantId(Long tenantId);

    // Lấy danh sách đối tác của Tenant theo loại (ví dụ lấy danh sách Nhà cung cấp để nhập kho)
    List<Partner> findAllByTenantIdAndPartnerTypeAndStatus(Long tenantId, PartnerType partnerType, PartnerStatus status);
}
