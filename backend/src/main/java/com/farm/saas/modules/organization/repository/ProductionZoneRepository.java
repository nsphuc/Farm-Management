package com.farm.saas.modules.organization.repository;

import com.farm.saas.modules.organization.entity.ProductionZone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng production_zones.
 * Tuân thủ nghiêm ngặt The Farm Barrier Guard & Tenant Isolation: Mọi truy vấn bắt buộc có tenantId và farmId.
 */
@Repository
public interface ProductionZoneRepository extends JpaRepository<ProductionZone, Long> {

    // Lấy chi tiết phân khu có kiểm tra cả farmId và tenantId (Composite Security Guard)
    Optional<ProductionZone> findByIdAndFarmIdAndTenantId(Long id, Long farmId, Long tenantId);

    // Kiểm tra sự tồn tại của phân khu thuộc đúng farmId và tenantId
    boolean existsByIdAndFarmIdAndTenantId(Long id, Long farmId, Long tenantId);

    // Lấy danh sách toàn bộ phân khu thuộc một farm cụ thể trong Tenant
    List<ProductionZone> findByFarmIdAndTenantId(Long farmId, Long tenantId);

    // Phân trang danh sách phân khu thuộc một farm
    Page<ProductionZone> findByFarmIdAndTenantId(Long farmId, Long tenantId, Pageable pageable);

    // Kiểm tra trùng mã phân khu trong cùng một Farm
    boolean existsByFarmIdAndCode(Long farmId, String code);

    // Kiểm tra trùng mã khi cập nhật phân khu khác
    boolean existsByFarmIdAndCodeAndIdNot(Long farmId, String code, Long id);
}
