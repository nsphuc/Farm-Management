package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.MaterialCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý bảng material_categories.
 * Áp dụng Tenant Isolation: Mọi truy vấn đều lồng tenantId.
 */
@Repository
public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Long> {

    // Lấy chi tiết nhóm vật tư theo ID và TenantId
    Optional<MaterialCategory> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra nhóm vật tư tồn tại trong Tenant
    boolean existsByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng mã code trong Tenant
    boolean existsByTenantIdAndCode(Long tenantId, String code);

    // Kiểm tra trùng mã code khi cập nhật nhóm khác
    boolean existsByTenantIdAndCodeAndIdNot(Long tenantId, String code, Long id);

    // Phân trang danh sách nhóm vật tư theo Tenant
    Page<MaterialCategory> findAllByTenantId(Long tenantId, Pageable pageable);

    // Lấy toàn bộ danh sách nhóm vật tư của Tenant (cho select box)
    List<MaterialCategory> findAllByTenantId(Long tenantId);
}
